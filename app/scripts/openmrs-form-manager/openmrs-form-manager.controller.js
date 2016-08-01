(function() {
    'use strict';
    /**
     * @ngdoc function
     * @name app.openmrsFormManager.controller:OpenmrsFormManagerCtrl
     * @description
     * # OpenmrsFormManagerCtrl
     * Controller of the app.openmrsFormManager
     */
    
    angular
      .module('app.openmrsFormManager')
        .controller('OpenmrsFormManagerCtrl', OpenmrsFormManagerCtrl);

    OpenmrsFormManagerCtrl.$inject = [
        '$log',
        '$scope',
        '$rootScope',
        'FormResService',
        'dialogs',
        '$state',
        'AuthService'
    ];

    function OpenmrsFormManagerCtrl($log,$scope, $rootScope, FormResService,
      dialogs, $state, AuthService) {
        
        $scope.vm = {};
        $scope.vm.query = '';
        $scope.vm.busy = true;
        
        $scope.vm.maxSize = 2;
        
        $scope.vm.errors = [];
        $scope.vm.existingForms = [];
        $scope.vm.errorFetchingForms = false;
        $scope.vm.authenticated = AuthService.authenticated();
        
        $scope.findDesiredForms = function(nameContaining) {
          $scope.vm.busy = true;
          var nameContaining = nameContaining || 'POC';
          FormResService.findPocForms(nameContaining).then(function(data) {
            $scope.vm.existingForms = _formatForms(data);
            // $scope.vm.currentPage = 1;
            // $scope.numPerPage = 2;
            // _getCurrentPageForms();
            $scope.vm.busy = false;
          })
          .catch(function(err) {
            $scope.vm.errorFetchingForms = err;
            $scope.vm.busy = false;
          });
        }
        
        $scope.$on('deauthenticated', function() {
          $scope.existingForms = [];
        });
        
        $scope.$on('authenticated', function(event, args) {
          $scope.findDesiredForms();
          $scope.vm.authenticated = true;
        }); 
        
        $scope.uploadSchema = function(form) {
          $log.debug(form.schema);
          FormResService.uploadFormResource(form.schema).then(function(data) {
            $log.debug('Returned from server:', data.data);
            
            // Upload resource info
            var newResource = {};
            var existing = _findResource(form.resources, 'AmpathJsonSchema');
            if(existing !== null) {
              newResource = {
                uuid: existing.uuid,
                name: existing.name || 'JSON schema',
                dataType: existing.dataType || 'AmpathJsonSchema',
                valueReference: data.data
              };  
            } else {
              newResource = {
                name: 'JSON schema',
                dataType: 'AmpathJsonSchema',
                valueReference: data.data
              }; 
            }
            
            // Post the new thing again.
            FormResService.saveFormResource(form.uuid, newResource)
            .then(function(resource) {
              if(existing !== null) {
                //update it.
                _.extendOwn(existing, resource);
              } else {
                form.resources.push(resource);
              }
              
              // Call format
              _formatSingleForm(form);
            })
            .catch(function(err) {
              $log.error('An error has occured', err);
            });
          })
          .catch(function(err) {
            $log.error('didn\'t go well', err);
          });
        }
        
        $scope.createForm = function() {
          $state.go('form-create', {relative:false});
        };

        
        function _formatForms(forms) {
          _.each(forms, function(form) {
            _formatSingleForm(form);
          });
          return forms;
        }
        
        function _formatSingleForm(form) {
          form.publishedText = form.published ? 'Yes' : 'No';
          form.publishedCssClass = form.published ? 'success': 'danger';
          form.schema = null;
          // Check whether it has resources
          if(form.resources && _findResource(form.resources)) {
            form.hasSchema = true;
            if(!form.published) {
              form.schemaAction = 'Update Schema';
            }
          } else {
            form.hasSchema = false;
            form.schemaAction = 'Upload Schema';
          }
          return form;
        }
        
        /**
         * Find a resource of a particular type in an array of resources.
         */
        function _findResource(formResources, resourceType) {
          var resourceType = resourceType || 'AmpathJsonSchema';
          if(_.isUndefined(formResources) || !Array.isArray(formResources)) {
            throw new Error('Argument should be array of form resources');
          }
          
          var found = _.find(formResources, function(resource) {
            return resource.dataType === resourceType;
          });
          
          if(found === undefined) return null;
          return found;
        }
        
        function _getCurrentPageForms() {
          var begin = (($scope.vm.currentPage - 1) * $scope.vm.numPerPage);
          var end = begin + $scope.vm.numPerPage;
          console.log('length is-------',$scope.vm.existingForms.length)
          $scope.vm.currentPageForms = $scope.vm.existingForms.slice(begin, end);
        }
    }
})();
