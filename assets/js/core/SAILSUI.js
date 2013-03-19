'use strict';
/* Helpers */
(function(undefined) {
	var autoGeneratedProperties = [
		'id',
		'createdAt',
		'updatedAt'];

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

	window.SAILSUI = window.SAILSUI || {
		attributes: {
			autoGenerated: autoGenerated,
			hasOnlyAutoGeneratedProperties: hasOnlyAutoGeneratedProperties,
			generateAttributes: generateAttributes
		}
	};
}());