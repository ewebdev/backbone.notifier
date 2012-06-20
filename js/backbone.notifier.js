/*!
 * backbone.notifier.js v0.0.1
 * Copyright 2012, Eyal Weiss
 * backbone.notifier.js may be freely distributed under the MIT license.
 */
(function($, Backbone, _) {
	var emptyFn = function(){},
		Notifier = Backbone.Notifier = Backbone.Model.extend({
			defaults: {
				types: ['warning', 'error', 'info', 'success'], // available notification styles
				'class': null, 		// default notification style (null / 'warning' / 'error' / 'info' / 'success')
				'ms': 10000,			// milliseconds before hiding
				'message': '',		// message content
				'hideOnClick': true,	// whether to hide the notifications on mouse click
				'loader': false,		// whether to display loader animation in notifactions
				'destroy': false,		// notification or selector of nofications to hide on show
				'modal': false,		// whether to dark and block the UI behind the nofication
				'opacity': 1,			// opacity of nofications
				'top': 0,				// distance between the notifications and the top edge
				'fadeInMs': 500,		// duration (milliseconds) of notification's fade-in effect
				'fadeOutMs': 500,		// duration (milliseconds) of notification's fade-out effect
				'position': 'top',		// default notifications position ('top' / 'center')
				'zIndex': 10000		// minimal z-index for notifications
			},
			transitions: {
				top: {
					'in': function(el, inner, options, duration){
						el.animate({top: options.top, opacity: options.opacity}, duration);
					},
					'out': function(el, inner, options, duration, callback){
						el.animate({top: -inner.height(), opacity: 0}, duration, callback || emptyFn);
					}
				},
				center: {
					'in': function(el, inner, options, duration){
						el.animate({top: ($(window).height()-inner.height())/2, opacity: options.opacity}, duration);
					},
					'out': function(el, inner, options, duration, callback){
						el.animate({top: -inner.height(), opacity: 0}, duration, callback || emptyFn);
					}
				}
			},
		    current: {},
			initialize: function(options){
				var scope = this,
					el = options && options.el ? options.el : 'body',
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

				var notifyFn = function(type, opts){
					if (_.isString(opts)){
						opts = {message: opts};
					}
					var o = _.extend({}, {'class': ''}, opts);
					o['class'] += ' ' + type;
					return scope.notify(o);
				};

				var createNotifyFn = function(type){
					scope[type] = function(opts){
						notifyFn(type, opts);
					}
				};

				_.each(options.types, function(type){
					createNotifyFn(type);
				});
			},
			calcZIndex: function(){
				var z = this.attributes.zIndex;
				_.each(this.current, function(view) {
					z = view.zIndex > z ? view.zIndex : z;
				});
				return ++z;
			},
		    destroyAll: function(keyFilter, valueFilter){
		    	var i=0;
				if (_.isFunction(keyFilter)) {
					_.each(this.current, function(view) {
						if (keyFilter(view)) {
							view.destroy.call(view);
							i++;
						}
					});
				} else if (keyFilter !== undefined) {
					_.each(this.current, function(view) {
						if (view.settings[keyFilter]===valueFilter) {
							view.destroy.call(view);
							i++;
						}
					});
				} else {
					_.each(this.current, function(view) {
						view.destroy.call(view);
						i++;
					});
				}
				return i;
		    },
		    notify: function(options){
				if (_.isString(options)){
					options = {message: options};
				}
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
				var zIndex = scope.calcZIndex.call(scope);
				var cls = ['notification', (settings['class'] || ''), 'pos-' + settings.position, settings.loader ? 'with-loader' : '' ].join(' ');
		    	var msgEl = $('<div class="' + cls + '"></div>');
	    		var msgInner = $('<div class="notification-inner"><div class="message">' + settings.message + '</div></div>').appendTo(msgEl);
    			msgEl.css({top: settings.top - 40, opacity: 0, zIndex: settings.modal ? ++zIndex : zIndex}).prependTo(this.$el);
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
					var btnsPh = $('<div class="btns"></div>').appendTo((innerPh = innerPh || msgEl.find('>div')));
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
	    			settings.modal && msgView.screenEl.fadeOut(300, function(){
						msgView.trigger('screenHidden', msgView, msgEl);
						msgView.screenEl.remove();
	    			});

					var outAnimFn = scope.transitions[settings.position].out;
					outAnimFn.call(scope, msgEl, msgInner, settings, options.fadeOutMs, function(){
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
		    			var screenEl = msgView.screenEl =  $('<div/>',{'class': 'notification-screen', css: {position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: zIndex-1  }}).prependTo($('body'));
						screenEl.click(function(e){
							e.preventDefault();
							e.stopPropagation();
							return false;
		    			});
		    		screenEl.fadeTo(300, .7);
		    	}
				if (settings.ms > 0  || settings.ms === 0){
					msgView.timeoutId = setTimeout(function(){
						msgView.trigger('timeout', msgView, msgEl);
						removeFn();
					}, settings.ms);
				}
	    		msgInner.click(settings.hideOnClick ? removeFn : preventDefaultFn);

				var animateFn = this.transitions[settings.position]['in'];
				scope.current[msgView.cid] = msgView;
				msgView.zIndex = zIndex;
				animateFn.call(this, msgEl, msgInner, settings, settings.fadeInMs);
				settings.css && msgInner.css(settings.css);
		    	return msgView;
		    }
	});

})(jQuery, Backbone, _);