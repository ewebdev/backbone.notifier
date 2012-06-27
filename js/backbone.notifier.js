/*!
 * Backbone.Notifier.js v0.1.0
 * Copyright 2012, Eyal Weiss
 * backbone.notifier.js may be freely distributed under the MIT license.
 */
(function($, Backbone, _) {
	var emptyFn = function(){},
		Notifier = Backbone.Notifier = Backbone.Model.extend({
			defaults: {
				'baseCls': 'notifier',
				'types': ['warning', 'error', 'info', 'success'], // available notification styles
				'dialog': false,		// whether display the notification with a title bar and a dialog style (sets 'hideOnClick' to false, unless defined)
				'message': '',		// message content
				'title': undefined,		// notification title, if defined causes the notification to be 'dialog' (unless dialog is 'false')
				'hideOnClick': true,	// whether to hide the notifications on mouse click
				'type': null, 		// default notification style (null / 'warning' / 'error' / 'info' / 'success')
				'class': null, 		// additional css class
				'ms': 10000,			// milliseconds before hiding
				'loader': false,		// whether to display loader animation in notifactions
				'destroy': false,		// notification or selector of nofications to hide on show
				'modal': false,		// whether to dark and block the UI behind the nofication
				'opacity': 1,			// opacity of nofications
				'top': 0,				// distance between the notifications and the top edge
				'fadeInMs': 500,		// duration (milliseconds) of notification's fade-in effect
				'fadeOutMs': 500,		// duration (milliseconds) of notification's fade-out effect
				'position': 'top',		// default notifications position ('top' / 'center')
				'screenOpacity': 0.5,	// opacity of dark screen background that goes behind for modals (between 0 to 1)
				'zIndex': 10000,		// minimal z-index for notifications
				'width': undefined,		// notification's width
				'template': function(settings){     		//function(sessings){ ... return html; }
					var strBuilder =  [
						'<div class="' + settings.wrapperCls + '">',
						'<div class="' +  settings.innerCls + '">',
						(settings.title ? '<div class="' + settings.baseCls + '-title">' + settings.title + '</div>' : '')
					];
					if (settings.dialog) {
						strBuilder.push(
							'<div class="' + settings.baseCls + '-message">' + settings.message +
								(settings.loader ? '<div class="' + settings.baseCls + '-loader"></div>' : '') +
							'</div>'
						);
					} else {
						strBuilder.push(
							'<div class="' + settings.baseCls + '-message">' + settings.message + '</div>',
							(settings.loader ? '<div class="' + settings.baseCls + '-loader"></div>' : '')
						);
					}
					if (settings.buttons) {
						var btnPh = $('<div />');
						_.each(settings.buttons, function(btn){
							btnPh.append($('<button/>', btn));
						});
						strBuilder.push('<div class="' + settings.baseCls + '-btns">' + btnPh.html() + '</div>');
					}
					strBuilder.push('</div></div>');
					return strBuilder.join('');
				}
			},
			transitions: {
				top: {
					'in': function(el, inner, options, duration, callback){
						el.animate({top: options.top, opacity: options.opacity}, duration, callback || emptyFn);
					},
					'out': function(el, inner, options, duration, callback){
						el.animate({top: -inner.height(), opacity: 0}, duration, callback || emptyFn);
					}
				},
				center: {
					'in': function(el, inner, options, duration, callback){
						el.animate({ top: '50%', marginTop: -inner.height()/2, opacity: options.opacity}, duration, callback || emptyFn);
					},
					'out': function(el, inner, options, duration, callback){
						el.animate({top: '0%', marginTop: -inner.height(), opacity: 0}, duration, callback || emptyFn);
					}
				}
			},
		    current: {},
			initialize: function(options){
				var scope = this,
					el = options && options.el ? options.el : 'body',
					$el = this.$el = _.isObject(el) ? el : $(el);

				$el.css('position', 'relative');

				scope.NotificationView = Backbone.View.extend({
					defaults: scope.attributes,
				    on: function(eventName, handler){
		    			var fn = handler,
							view = this;
		    			if (_.isString(handler)) {
							fn = function(){
								view[handler].apply(view, arguments);
		    				};
		    			}
		    			return Backbone.View.prototype.on.call(this, eventName, fn);
		    		}
				});

				var notifyFn = function(type, opts){
					if (_.isString(opts)){
						opts = {message: opts};
					}
					var o = _.extend({}, {'type': ''}, opts);
					o['type'] = o['type'] ? type + ' ' + o['type'] : type;
					return scope.notify(o);
				};

				var createNotifyFn = function(type){
					scope[type] = scope[type] || function(opts){
						notifyFn(type, opts);
					}
				};

				_.each(scope.attributes.types, function(type){
					createNotifyFn(type);
				});
			},
			calcZIndex: function(){
				var z = this.attributes.zIndex,
					scope = this;
				_.each(scope.current, function(view) {
					z = view.zIndex > z ? view.zIndex : z;
				});
				return ++z;
			},
		    destroyAll: function(keyFilter, valueFilter){
		    	var i= 0,
					scope = this;
				if (_.isFunction(keyFilter)) {
					_.each(scope.current, function(view) {
						if (keyFilter(view)) {
							view.destroy.call(view);
							i++;
						}
					});
				} else if (keyFilter !== undefined) {
					_.each(scope.current, function(view) {
						if (view.settings[keyFilter]===valueFilter) {
							view.destroy.call(view);
							i++;
						}
					});
				} else {
					_.each(scope.current, function(view) {
						view.destroy.call(view);
						i++;
					});
				}
				return i;
		    },
			getWrapperCls: function(settings){
				var c = (settings.baseCls + ' ') +
					   (settings.type ? settings.type + ' ' : '') +
					   (settings.dialog ? 'dialog ' : '') +
					   ('pos-' + settings.position + ' ') +
					   (settings.buttons ? 'block ' : '') +
					   (settings.loader ? 'with-loader ' : '');
				return $.trim(c).split(' ').join(' ' + settings.baseCls + '-') + ' ' + (settings['class'] || '');
			},
			getSettings: function(options){
				if (!options) {
					options = {};
				} else if (_.isString(options)){
					options = {message: options};
				}
				var settings = $.extend({}, this.attributes, options);
				if (settings.title && options.dialog === undefined) {
					settings.dialog = true;
				}
				if ((settings.modal || settings.dialog) && options.hideOnClick === undefined) {
					settings.hideOnClick = false;
				}
				if (settings.dialog && options.ms === undefined) {
					settings.ms = null;
				}
				if (settings.dialog && options.position === undefined) {
					settings.position = 'center';
				}
				return settings;
			},
		    notify: function(options){
				var scope = this,
					settings = this.getSettings(options);

				if (_.isObject(settings.destroy)){
			    	if (settings.destroy instanceof scope.NotificationView){
						settings.destroy.destroy();
			    	} else {
			    		scope.destroyAll.apply(scope, _.isArray(settings.destroy) ? settings.destroy : [settings.destroy]);
			    	}
		    	} else if (settings.destroy == true) {
					scope.destroyAll();
		    	}
				var zIndex = scope.calcZIndex.call(scope);

				settings.wrapperCls = scope.getWrapperCls(settings);
				settings.innerCls = settings.baseCls + '-inner';

				var msgEl = $(settings.template(settings)),
					msgInner = msgEl.find('.' + settings.innerCls);
					settings.width && msgInner.css({width: settings.width});

				Notifier._modulesBinder.trigger('beforeAppendMsgEl', scope, settings, msgEl, msgInner);
				msgEl.css({top: settings.top - 40, opacity: 0, zIndex: settings.modal ? ++zIndex : zIndex}).prependTo(scope.$el);
				var msgView = new scope.NotificationView({
		    		el: msgEl
		    	});
		    	msgView.settings = settings;

				if (settings.buttons || msgInner.find('button').length) {
					msgInner.on('click', 'button[data-handler]', function(){
						var handler = $(this).data('handler'),
							fn = _.isFunction(handler) ? handler : msgView[handler];
						fn.apply(msgView, arguments);
					});
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
						msgView.trigger('screenHide', msgView, msgEl);
						msgView.screenEl.remove();
	    			});

					Notifier._modulesBinder.trigger('beforeHideMsgEl', scope, settings, msgEl, msgInner, msgView);
					var outAnimFn = scope.transitions[settings.position].out;
					outAnimFn.call(scope, msgEl, msgInner, settings, settings.fadeOutMs, function(){
						msgView.remove();
						msgView.trigger('destroy', msgView, msgEl);
						Notifier._modulesBinder.trigger('afterDestroyMsgEl', scope, settings, msgEl, msgInner, msgView);
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
		    			var screenEl = msgView.screenEl =  $('<div/>',{'class': settings.baseCls + '-screen', css: {position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: zIndex-1  }}).prependTo($('body'));
						screenEl.click(function(e){
							e.preventDefault();
							e.stopPropagation();
							return false;
		    			});
		    		screenEl.fadeTo(300, settings.screenOpacity);

		    	}

				if (settings.ms > 0  || settings.ms === 0){
					msgView.timeoutId = setTimeout(function(){
						msgView.trigger('timeout', msgView, msgEl);
						removeFn();
					}, settings.ms);
				}

	    		msgInner.click(settings.hideOnClick ? removeFn : preventDefaultFn);

				var animateFn = scope.transitions[settings.position]['in'];
				scope.current[msgView.cid] = msgView;
				msgView.zIndex = zIndex;
				settings.css && msgInner.css(settings.css);

				Notifier._modulesBinder.trigger('beforeAnimateInMsgEl', scope, settings, msgEl, msgInner, msgView);
				animateFn.call(scope, msgEl, msgInner, settings, settings.fadeInMs, function(){
					Notifier._modulesBinder.trigger('afterAnimateInMsgEl', scope, settings, msgEl, msgInner, msgView);
				});
		    	return msgView;
		    }
	});


	// ====================== Modules mechanism ======================
	Notifier.getModule = function(moduleName){
		return (_.isObject(moduleName)) ? moduleName : Notifier.modules[moduleName];
	};

	var modulesBinder = {},
		shift = Array.prototype.shift;
	_.extend(modulesBinder, Backbone.Events);
	Notifier._modulesBinder = modulesBinder;

	Notifier.regModule = function(moduleName, m){
		if (arguments.length === 1) {
			m = $.isFunction(moduleName) ? moduleName() : moduleName;
			moduleName = m.name;
		} else {
			m = $.isFunction(m) ? m() : m;
			m.name = moduleName;
		}
		if (!moduleName) {
			throw('module name is not defined.');
		}
		if (m.extend) {
			$.each(m.extend, function(k, v){
				var orig = Notifier.prototype[k];
				if (_.isFunction(orig)) {
					Notifier.prototype[k] = function(){
						v.apply({scope: this, supr: orig, module: m}, arguments);
					};
				} else {
					Notifier.prototype[k] = $.extend(true, {}, orig, v );
				}
			});
		}
		(Notifier.modules = Notifier.modules || {})[moduleName] = m;
		$.isFunction(m.register) && m.register.call(m, Notifier);
		m.enabled && Notifier.enableModule(m);
		return m;
	};

	Notifier.enableModule = function(moduleName){
		var m = Notifier.getModule(moduleName);
		if (m) {
			m._handlers = m._handlers || {};
			$.each(m.events, function(k, fn){
				var handler = m._handlers[k] = function(){
					var notifier = shift.call(arguments);
					fn.apply({module: m, scope: notifier}, arguments);
				};
				Notifier._modulesBinder.on(k, handler);
			});
			m.enabled = true;
			$.isFunction(m.enable) && m.enable.call(m, Notifier);
			return m;
		}

//		console.log('module "'  + moduleName + '" is not registered.');
		return false;
	};

	Notifier.disableModule = function(moduleName){
		var m = Notifier.getModule(moduleName);
		if (m) {
			$.each(m._handlers, function(k, fn){
				Notifier._modulesBinder.off(k, fn);
			});
			m.enabled = false;
			$.isFunction(m.disable) && m.disable.call(m, Notifier);
			return m;
		}
//		console.log('module "'  + moduleName + '" is not registered.');
		return false;
	};

})(jQuery, Backbone, _);