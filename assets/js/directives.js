'use strict';

/* Directives */

angular.module('sailsUI.directives', [])
	.directive('appVersion', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	})
	//extend html5 contenteditable with placeholder and focus-hightlighting
	.directive('contenteditable', function() {
		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				//console.log('call',arguments)
				// view -> model
				elm.bind('blur', function() {
					scope.$apply(function() {
						ctrl.$setViewValue(elm.html());
					});
				});

				elm.bind('focus',addPlaceholder);
				elm.on('blur', addPlaceholder);

				function addPlaceholder(e) {
					var el = elm.get(0);

					elm.removeClass('placeHolder');
					if (!scope.$eval(attrs.ngModel) && !elm.html()) {
						elm.html(elm.attr('placeholder'));
						elm.addClass('placeHolder');
					}

					else if (elm.html() === elm.attr('placeholder')) {
						elm.removeClass('placeHolder');
						if (e.type === 'focus' && !scope.$eval(attrs.ngModel)) {
							elm.empty();
						}
					}

					//highlight all the text on focus (replicate default inputs)
					if (e && e.type === 'focus') {
						var range = document.createRange();
						range.selectNodeContents(el);
						var sel = window.getSelection();
						sel.removeAllRanges();
						sel.addRange(range);
					}
				}
				addPlaceholder();

				// model -> view
				ctrl.render = function(value) {
					elm.text(value);
				};

				// load init value from model
				elm.text(scope.$eval(attrs.ngModel));

				elm.bind('keydown', function(event) {
					var esc = event.which == 27,
						el = event.target;

					if (esc) {
						ctrl.$setViewValue(elm.html());
						el.blur();
						event.preventDefault();
					}
				});
			}
		};
	});