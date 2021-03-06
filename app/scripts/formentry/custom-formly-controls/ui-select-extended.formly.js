/*
jshint -W106, -W098, -W109, -W003, -W068, -W004, -W033, -W030, -W117, -W116, -W069, -W026
*/
/*
jscs:disable disallowMixedSpacesAndTabs, requireDotNotation, requirePaddingNewLinesBeforeLineComments, requireTrailingComma
*/
(function () {

    'use strict';

    var mod =
        angular
            .module('openmrs.angularFormentry');

    mod.run(function (formlyConfig) {
        formlyConfig.setType({
            name: 'ui-select-extended',
            wrapper: ['bootstrapLabel', 'bootstrapHasError', 'validation'],
            template: '<div class="input-group">' +
            '<ui-select ng-model="model[options.key]" theme="bootstrap" ' +
            'ng-required="{{to.required}}" ng-disabled="{{to.disabled}}" ' +
            'reset-search-input="false"> ' +
            '<ui-select-match placeholder="{{to.placeholder}}"> ' +
            '{{evaluateFunction($select.selected[to.labelProp || \'name\'])}}{{setSelectedObject($select.selected)}}' +
            '</ui-select-match> ' +
            '<ui-select-choices refresh="refreshItemSource($select.search)" ' +
            'group-by="to.groupBy" refresh-delay="1000"' +
            'repeat="(evaluateFunction(option[to.valueProp || \'value\'])) ' +
            'as option in itemSource" > ' +
            '<div ng-bind-html="evaluateFunction(option[to.labelProp || \'name\']) | ' +
            'highlight: $select.search"></div> </ui-select-choices> </ui-select>' +
            '<div class="input-group-addon" >' +
            '<span class="text-primary" ng-show="isBusy">Loading..</span>' +
            '</div>' +
            '</div>',
            link: function (scope, el, attrs, vm) {
                //incase we need link function
            },

            controller: function ($scope, $log) {
                var vm = this;
                $scope.to.required = $scope.options.expressionProperties['templateOptions.required'];
                $scope.to.disabled = $scope.options.expressionProperties['templateOptions.disabled'];
                $scope.itemSource = [];
                $scope.refreshItemSource = refreshItemSource;
                $scope.evaluateFunction = evaluateFunction;
                $scope.setSelectedObject = setSelectedObject;
                vm.getSelectedObject = getSelectedObject;

                $scope.$watch(function (scope) {
                    return evaluateFunction(scope.model[scope.options.key]);
                },

                    function (val) {
                        if ($scope.itemSource !== undefined && $scope.itemSource.length === 0) {
                            getSelectedObject();
                        }

                    });

                activate();
                function activate() {
                    validateTemplateOptions();
                    getSelectedObject();
                }

                function getSelectedObject() {
                    var selectedValue = $scope.model[getKey($scope.options.key)] ?
                        (typeof $scope.model[getKey($scope.options.key)].value === 'function' ?
                            $scope.model[getKey($scope.options.key)].value() : $scope.model[getKey($scope.options.key)].value) : undefined;
                    if (selectedValue !== undefined && selectedValue !== null && selectedValue !== '') {
                        $scope.isBusy = true;
                        $scope.to.getSelectedObjectFunction(selectedValue, function (object) {
                            $scope.isBusy = false;
                            $scope.itemSource = [object];
                        },

                            function (error) {
                                $scope.isBusy = false;
                                $log.error(error);
                            });
                    }
                }

                function refreshItemSource(value) {
                    if (isBlank(value) === false) {
                        $scope.isBusy = true;
                        $scope.to.deferredFilterFunction(value, function (results) {
                            $scope.isBusy = false;
                            $scope.itemSource = results;
                        },

                            function (error) {
                                $scope.isBusy = false;
                                $log.error(error);
                            });
                    }
                }

                function setSelectedObject(selectedObject) {
                    console.log('setting selected object', selectedObject);
                    $scope.model[getKey($scope.options.key)].valueObject = selectedObject;
                }

                function evaluateFunction(obj) {
                    //console.log('$select.selected', obj);
                    if (obj && (typeof obj) === 'function') {
                        return obj();
                    }

                    return obj;
                }

                function isBlank(str) {
                    if (str === null || str.length === 0 || str === ' ') return true;
                    return false;

                }

                function getKey(key) {
                    if (key === null || key === undefined) {
                        return key;
                    }

                    return key.split('.')[0];
                }

                function validateTemplateOptions() {
                    if (!$scope.to.deferredFilterFunction) {
                        $log.error('Template Options must define deferredFilterFunction');
                        $log.error($scope.to);
                    }

                    if ($scope.to.deferredFilterFunction && (typeof $scope.to.deferredFilterFunction) !== 'function') {
                        $log.error('Template Options deferredFilterFunction is a function');
                        $log.error($scope.to);
                    }

                    if (!$scope.to.getSelectedObjectFunction) {
                        $log.error('Template Options must define getSelectedObjectFunction');
                        $log.error($scope.to);
                    }

                    if ($scope.to.getSelectedObjectFunction && (typeof $scope.to.getSelectedObjectFunction) !== 'function') {
                        $log.error('Template Options getSelectedObjectFunction is a function');
                        $log.error($scope.to);
                    }
                }
            }
        });
    });

})();
