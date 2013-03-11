'use strict';

/* Controllers */

function IndexCtrl($scope, $http) {
	//$scope.method = function;
	//$scope.refresh();
}


function FrontendIndexCtrl($scope, $http) {
	//$scope.method = function;
	//$scope.refresh();
}


function DataListCtrl($scope,$http) {
	$http.get("/models").then(function(data) {
		//massage both the object of models and the
		//attributes of each model to arrays for the
		//template
		var models = [];
		for (var prop in data.data) {
			var massagedData = data.data[prop];
			massagedData.schema = generateAttributes(massagedData.schema);
			models.push(massagedData);
		}
		$scope.models = models;
		$scope.autoGenerated = autoGenerated;
	});
}

function NotFoundCtrl($scope,$http,sharedService,authService) {
	//onload check auth state
	$scope.authenticated = authService.getAuth();
	//when login action happens we detect it
	$scope.$on('handleBroadcast', function() {
		if (sharedService.message === 'loggedIn') {
			$scope.authenticated = authService.getAuth();
		}
	});
}

function ModelsListCtrl($scope, $http) {
	$http.get("/models").then(function(data) {
		//massage both the object of models and the
		//attributes of each model to arrays for the
		//template
		var models = [];
		for (var prop in data.data) {
			var massagedData = data.data[prop];
			massagedData.schema = generateAttributes(massagedData.schema);
			models.push(massagedData);
		}
		$scope.models = models;
		$scope.autoGenerated = autoGenerated;
	});
}

function DataViewCtrl($scope, $http, $routeParams, sharedService, $location) {
	$http.get("/models").then(function(data) {
		$scope.model = data.data[$routeParams.id];
		$scope.attributes = generateAttributes($scope.model.schema);
		$http.get("/"+$scope.model.globalId.toLowerCase()+'/findAll').then(function(data){
			$scope.data = data.data;
		});
	});

	$scope.dateFormat = function(date) {
		var d = new Date(date);
		var dformat = [(d.getMonth()+1).padLeft(),
               d.getDate().padLeft(),
               d.getFullYear()].join('/')+
              ' ' +
              [d.getHours().padLeft(),
               d.getMinutes().padLeft(),
               d.getSeconds().padLeft()].join(':');
		return dformat;
	};
}

function ModelsViewCtrl($scope, $http, $routeParams, sharedService) {
	//get the list of all models
	$http.get("/models").then(function(data) {
		//determine if this is existing or new
		$scope.model = data.data[$routeParams.id] || { model:{schema:{}, globalId: ''} };
		//if new set a flag
		if (!$scope.model.globalId) {
			$scope.isNew = true;
		}
		//manipulate the attributes into something easy for the template
		$scope.attributes = generateAttributes($scope.model.schema);

		//add the autogenerated method
		$scope.autoGenerated = autoGenerated;

		//show auto-generated if those are the only properties the model has
		$scope.showAutoGenerated = hasOnlyAutoGeneratedProperties($scope.model.schema);

		//called when the update/create button is clicked
		$scope.updateModel = function() {
			//generate clean copies of the attributes
			var toSend = [];
			$scope.attributes.forEach(function(attr) {
				if (!autoGenerated(attr._key)) {
					toSend.push({
						name: attr._key || '',
						type: attr.type || ''
					});
				}
			});

			//clear flags
			$scope.saved = false;
			$scope.error = '';

			//make request
			$http({
				method: 'POST',
				url: "/models/scaffold",
				data: {
					name: $scope.model.globalId,
					attributes: toSend
				}
			}).then(function(data) {
				if (data.data.success) {
					//set flag and fire pubsub event
					$scope.saved = true;
					sharedService.prepForBroadcast('changesUpdated');
				} else if (data.data.error) {
					$scope.error = data.data.error;
				}
			});
		};

		/* adds a new property */
		$scope.addProperty = function() {
			$scope.attributes.push({type: 'STRING'});
		};

		$scope.removeProperty = function(idx) {
			$scope.attributes.splice(idx, 1);
		};

		/* close buttons on error/saved (todo replace w angular-bootstrap) */
		$scope.clearError = function() {
			$scope.error = '';
		};
		$scope.clearSaved = function() {
			$scope.saved = '';
		};

		/* generates the command the server will execute */
		$scope.generateCommand = function() {
			var str = '';
			$scope.attributes.forEach(function(attr) {
				if (!autoGenerated(attr._key)) {
					//parse each non-auto-generated attribute into key:type
					if (attr._key) {
						str += (attr._key || '') + ':' + (attr.type || '');
					}
					//add a space between each attribute
					if (str !== '') {
						str += ' ';
					}
				}
			});
			return 'sails scaffold model ' + ($scope.model.globalId || '') + ' ' + str;
		};
	});
}

function NavCtrl($scope, $http, $location, sharedService, authService) {
	$scope.navClass = function(page, opt) {
		var currentRoute = $location.path().substring(1) || 'index';
		if (opt === 'contains') {
			return currentRoute.indexOf(page) !== -1 ? 'active' : '';
		}
		return page === currentRoute ? 'active' : '';
	};

	/* if there are pending server changes requiring restart */
	$scope.pendingChanges = false;
	$scope.$on('handleBroadcast', function() {
		if (sharedService.message === 'changesUpdated') {
			$scope.pendingChanges = true;
		}
	});

	$scope.signIn = function() {
		$scope.error = false;
		$http({
			method: 'POST',
			url: "/cms/login",
			data: {
				username: $scope.username,
				password: $scope.password
			}
		}).then(function(res) {
			if (res.data.success) {
				$scope.authenticated = authService.setAuth(true);
				$scope.user = res.data.user;
				sharedService.prepForBroadcast('loggedIn');
			} else {
				$scope.error = res.data.error;
			}
		});
	};

	$scope.cmsRedirect = function() {
		window.location = '/cms/index';
	};

	$scope.frontendRedirect = function() {
		window.location = '/';
	};

	//onload auto-log-in if the server still has a session for the user
	$http({
		method: 'POST',
		url: "/cms/checkAuthenticated"
	}).then(function(res) {
		if (res.data.success) {
			$scope.authenticated = authService.setAuth(true);
			$scope.user = res.data.user;
			sharedService.prepForBroadcast('loggedIn');
		}
	});
}

/* Helpers */

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}

var autoGeneratedProperties = [
	'id',
	'createdAt',
	'updatedAt'
];

function autoGenerated(prop) {
	if (autoGeneratedProperties.indexOf(prop) !== -1) {
		return true;
	}
	return false;
}

function hasOnlyAutoGeneratedProperties(schema) {
	for (var property in schema) {
		if (!autoGenerated(property)) {
			return false;
		}
	}
	return true;
}

function generateAttributes(schema) {
	var attributes = [];
	for (var attr in schema) {
		var newObj = {};
		for (var prop in schema[attr]) {
			if (typeof schema[attr][prop] !== 'object') {
				if (prop === 'type') {
					schema[attr][prop] = schema[attr][prop].toUpperCase();
				}
				newObj[prop] = schema[attr][prop];
			}
		}
		newObj._key = attr;
		attributes.push(newObj);
	}
	return attributes;
}