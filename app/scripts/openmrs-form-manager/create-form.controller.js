(function() {
    'use strict';
    /**
     * @ngdoc function
     * @name angularFormentryApp.controller:CreateFormCtrl
     * @description
     * # CreateFormCtrl
     * Controller for creating a new form/form component
     */
    angular
        .module('app.openmrsFormManager')
        .controller('CreateFormCtrl', CreateFormCtrl);

    CreateFormCtrl.$inject = [
      '$scope',
      '$rootScope',
      'FormResService',
      '$log',
      'dialogs'
    ];
    
    function CreateFormCtrl($scope, $rootScope, FormResService, $log, dialogs) {
      $scope.formCreation = {
        busy: false
      };
      $scope.model = {};
      
      // Fields 
      $scope.fields = [{
        key: 'name',
        type: 'input',
        templateOptions: {
          label: 'Form Name',
          required: true,
        }
      }, {
        key: 'version',
        type: 'input',
        templateOptions: {
          label: 'Version',
          required: true
        }
      }, {
        key: 'published',
        type: 'checkbox',
        templateOptions: {
          label: 'Published'
        }
      }, {
        key: 'uploadFile',
        type: 'checkbox',
        templateOptions: {
          label: 'I want to upload schema file',
        }
      }, {
        key: 'jsonSchema',
        type: 'aceJsonEditor',   //TODO: Improve this to use a sophisticated Editor
        hideExpression: 'model.uploadFile',
        templateOptions: {
          label: 'JSON Schema'
        }
      }, {
        key: 'fileSchema',
        type: 'fileUpload',
        hideExpression: '!model.uploadFile',
        templateOptions: {
          label: 'Schema file',
          required: true,
        }
      }];
      
      $scope.create = function() {
        // check if schema is empty
        if(($scope.model.uploadFile && !$scope.model.fileSchema) || 
                (!$scope.model.uploadFile && !$scope.model.jsonSchema)) {
          dialogs.notify('JSON Schema', 'You need either to choose a json '
           + 'schema file to upload or define the json schema in the editor '
           + 'provided');
        } else {
          if($scope.model.uploadFile) {
            var schemaBlob = $scope.model.fileSchema;
          } else {
            //Entered as text
            var schemaBlob = new Blob($scope.model.jsonSchema, {type:'application/json'});
          }
          
          //Upload the schema file
          // TODO: Validate json schema
          $log.debug('Uploading schema: ', schemaBlob);
          FormResService.uploadFormResource(schemaBlob).then(function(response) {
            $log.debug('uuid of newly created json schema resource: ', response.data);
            var newForm = {
              name: $scope.model.name,
              version: $scope.model.version,
              published: $scope.model.published || false,
            };
            $log.debug('Now uploading the form details: ', newForm);
            FormResService.saveForm(newForm).then(function(createdForm) {
              $log.debug('Form created successfully', createdForm);
              
              var resource = {
                name: 'JSON schema',
                dataType: 'AmpathJsonSchema',
                valueReference: response.data
              }
              // Now saving the resource: This really sucks,
              $log.debug('Creating a resource for newly created form', resource);
              FormResService.saveFormResource(createdForm.uuid, resource)
              .then(function(resource) {
                $log.debug('clobdata, form and resource all created successfully');
                dialogs.notify('New Form', 'You got this! done successfully!');
              })
              .catch(function(err) {
                $log.error('resource could not be created, this sucks because '
                          + 'the other two went through aaargh!');
                dialogs.error('Resource Creation Error',JSON.stringify(err,null,2));
              });
            })
            .catch(function(err) {
              $log.error('Form details could not be posted, the resource has'
              + ' been posted though!', err);
              dialogs.error('Form Creation Error',JSON.stringify(err,null,2));
            });
          })
          .catch(function(err) {
            $log.error('Error uploading file, form creation failed', err);
            dialogs.error('File Upload Error', JSON.stringify(err,null,2));
          });
        }
      }
      
    }
})();
