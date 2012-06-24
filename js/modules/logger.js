/*!
 * Backbone.Notifier Logger Module v0.0.1
 * Copyright 2012, Eyal Weiss
 * Backbone.Notifier Logger Module be freely distributed under the MIT license.
 */
(function(Notifier, $){

	Notifier.regModule({
		name: 'logger',	// Required.
		enabled: true,  // Optional. Whether you like the module to be auto-enabled upon registration (default: false).
		extend: { 	// Optional. Data/functions to extend Backbone.Notifier.prototype
			defaults: {
				'showInLog': true
			},
			// Overriding existing function of Backbone.Notifier.prototype
			// "this" refers to:
			// {
			//   super: function(){/* the function we override */},
			// 	 module: {/* this module */}},
			// 	 scope: {/* this context of the function we override (an *instance* of Backbone.Notifier) */}}
			// }
			// 'initialize' is called when instantiating a new Backbone.Notifier
			initialize: function(){
				this.super.apply(this.scope, arguments);
				this.scope._loggerNotifierId = ++this.module._notifiers;
				this.module._log('initialized notifier #' + this.scope._loggerNotifierId);
			}
		},
		// Optional. Unique events accessible for modules, dynamic binding/unbinding is not supported (at the moment).
		// In all event handlers, "this" refers to:
		// {
		//   super: function(){/* the function we override */},
		// 	 module: {/* this module */}},
		// 	 scope: {/* this context of the function we override (an *instance* of Backbone.Notifier) */}}
		// }
		events: {
			'beforeAppendMsgEl': function(settings, msgEl, msgInner, msgView){
				settings._loggerNotificationId = ++this.module._notifications;
				settings.showInLog && this.module._log('beforeAppendMsgEl #' + settings._loggerNotificationId, settings);
			},
			'beforeAnimateInMsgEl': function(settings, msgEl, msgInner, msgView){
				settings.showInLog && this.module._log('beforeAnimateInMsgEl #' + settings._loggerNotificationId, msgView);
			},
			'afterAnimateInMsgEl': function(settings, msgEl, msgInner, msgView){
				settings.showInLog && this.module._log('afterAnimateInMsgEl #' + settings._loggerNotificationId, msgView);
			},
			'beforeHideMsgEl': function(settings, msgEl, msgInner, msgView){
				settings.showInLog && this.module._log('beforeHideMsgEl #' + settings._loggerNotificationId, msgView);
			},
			'afterDestroyMsgEl': function(settings, msgEl, msgInner, msgView){
				settings.showInLog && this.module._log('afterDestroyMsgEl #' + settings._loggerNotificationId, msgView);
			}
		},
		// Helper function defined for this module.
		_log: function(a, b){
			a = 'logger: ' + a;
			arguments.length === 2 ? console.log(a, b) : console.log(a);
		},
		// Optional. Triggers immediately when Backbone.Notifier finishes the 'regModule' action
		register: function(){
			this._notifications = 0;
			this._notifiers = 0;
			this._log(this.name + ' module was registered');
		},
		// Optional. Called after module is enabled by Backbone.Notifier.enableModule(moduleName)
		// or after registration when 'enabled' property is set to true.
		enable: function(){
			this._log(this.name + ' module was enabled');
		},
		// Optional. Called after module is disabled by Backbone.Notifier.disableModule(moduleName)
		disable: function(){
			this._log(this.name + ' module was disabled');
		}
	});

})(Backbone.Notifier, jQuery);