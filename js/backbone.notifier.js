/*!
 * backbone.notifier.js v0.0.1
 * Copyright 2012, Eyal Weiss
 * backbone.notifier.js may be freely distributed under the MIT license.
 */
(function(window) {

	var Backbone = window.Backbone,
		_ = window._,
		$ = window.$;

	var Notifier = Backbone.Notifier = Backbone.Model.extend({
			defaults: {
				'class': null, 		// notification style (null / 'error' / 'info' / 'ok')
				'ms': 10000,			// milliseconds before hiding
				'message': '',		// message content
				'hideOnClick': true,	// whether to hide the notifications on mouse click
				'loader': false,		// whether to display loader animation in notifactions
				'destroy': false,		// notification or selector of nofications to hide on show
				'modal': false,		// whether to dark and block the UI behind the nofication
				'opacity': 1,			// opacity of nofications
				'top': 0,				// distance between the notifications and the top edge
				'fadeInMs': 500,		// duration (milliseconds) of notification's fade-in effect
				'fadeOutMs': 500		// duration (milliseconds) of notification's fade-out effect
			},
		    current: {},
			initialize: function(options){
				var el = options && options.el ? options.el : 'body',
					$el = this.$el = _.isObject(el) ? el : $(el);
					$el.css('position', 'relative');

				this.NotificationView = Backbone.View.extend({
					defaults: this.attributes,
				    on: function(eventName, handler){
		    			var fn = handler;
		    			if (_.isString(handler)) {
		    				fn = function(){ 
		    					this[handler].apply(this, arguments);
		    				};
		    			}
		    			return Backbone.View.prototype.on.call(this, eventName, fn);
		    		}
				});
			},
		    destroyAll: function(keyFilter, valueFilter){
		    	var i=0;
				if (_.isFunction(keyFilter)) {
					_.each(this.current, function(view, k) {
						if (keyFilter(view)) {
							view.destroy.call(view);
							i++;
						}
					});
				} else if (keyFilter !== undefined) {
					_.each(this.current, function(view, k) {
						if (view.settings[keyFilter]===valueFilter) {
							view.destroy.call(view);
							i++;
						}
					});
				} else {
					_.each(this.current, function(view, k) {
						view.destroy.call(view);
						i++;
					});
				}
				return i;
		    },
		    notify: function(options){
		    	var settings = $.extend({}, this.attributes, options),
		    		scope = this;
	    		if (settings.modal && (options || {}).hideOnClick === undefined) {
	    			settings.hideOnClick = false;
	    		}

		    	if (_.isObject(settings.destroy)){
			    	if (settings.destroy instanceof this.NotificationView){
						settings.destroy.destroy();
			    	} else {
			    		scope.destroyAll.apply(scope, _.isArray(settings.destroy) ? settings.destroy : [settings.destroy]);
			    	}
		    	} else if (settings.destroy == true) {
					scope.destroyAll();
		    	}

		    	var msgEl = $('<div class="notification ' + (settings['class'] || '') + '"></div>');
	    		var msgInner = $('<div>' + settings.message + '</div>').appendTo(msgEl);
    			msgEl.css({top: settings.top - 40, opacity: 0}).prependTo(this.$el);
		    	var msgView = new this.NotificationView({  
		    		el: msgEl
		    	});
		    	msgView.settings = settings;

				var innerPh;
		    	if (settings.loader) {
		    		(innerPh = innerPh || msgEl.find('>div'))
		    			.append('<div class="loader"></div>');
		    	}

				if (settings.buttons) {
					var btnsPh = $('<div class="btns" />').appendTo((innerPh = innerPh || msgEl.find('>div')));
					_.each(settings.buttons, function(btn, i){
						btnsPh.append($('<button/>', btn));
					});
				}

				if (settings.buttons || msgInner.find('button').length) {
					msgEl.addClass('block');
					msgInner.on('button click', function(e){
						msgView.trigger('click:' + $(e.target).data('role'));
					});
				}

		    	var removeFn = msgView.destroy = function(e){
	    			if (_.isObject(e) && e.preventDefault) {
	    				e.preventDefault();
	    				e.stopPropagation();
	    			} 
	    			msgView.trigger('beforeHide', msgView, msgEl);
	    			settings.modal && scope.screenEl.fadeOut(300, function(){
	    				msgView.trigger('screenHidden', msgView, msgEl);
	    			});
		    		msgEl.animate({top: -msgInner.height(), opacity: 0}, settings.fadeOutMs, function(){
						msgView.remove();
						msgView.trigger('destroyed', msgView, msgEl);
						_.isFunction(e) && e.call(msgView, msgView, msgEl);
		    		});
					if (msgView.timeoutId) {
						clearTimeout(msgView.timeoutId);
					}
					delete msgView.timeoutId;
					delete scope.current[msgView.cid];
		    	};

		    	var preventDefaultFn = function(e){
	    			e && (e.preventDefault(), e.stopPropagation());
		    	};

		    	if (settings.modal) {
		    		if (!scope.screenEl || !scope.screenEl.parent().length){
		    			scope.screenEl = $('<div/>',{'class': 'notification-screen', css: {position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}).prependTo($('body'));
		    			scope.screenEl.click(function(e){
							e.preventDefault();
							e.stopPropagation();
							return false;
		    			});
		    		}
		    		scope.screenEl.fadeTo(300, .7);
		    	}		 
		    	if (settings.ms > 0  || settings.ms === 0){
		    		msgView.timeoutId = setTimeout(removeFn, settings.ms);
		    	}
	    		msgInner.click(settings.hideOnClick ? removeFn : preventDefaultFn);
		    	msgEl.animate({top: settings.top, opacity: settings.opacity}, settings.fadeInMs);
		    	settings.css && msgInner.css(settings.css);
				scope.current[msgView.cid] = msgView;
		    	return msgView;
		    }
	});

})(this);