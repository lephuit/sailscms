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
		$scope.attributes = SAILSUI.attributes.generateAttributes($scope.model.schema);

		//add the autogenerated method
		$scope.autoGenerated = SAILSUI.attributes.autoGenerated;

		//show auto-generated if those are the only properties the model has
		$scope.showAutoGenerated = SAILSUI.attributes.hasOnlyAutoGeneratedProperties($scope.model.schema);

		//called when the update/create button is clicked
		$scope.updateModel = function() {
			//generate clean copies of the attributes
			var toSend = [];
			$scope.attributes.forEach(function(attr) {
				if (!SAILSUI.attributes.autoGenerated(attr._key)) {
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
				if (!SAILSUI.attributes.autoGenerated(attr._key)) {
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