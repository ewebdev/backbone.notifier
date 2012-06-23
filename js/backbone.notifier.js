/*!
 * backbone.notifier.js v0.0.1
 * Copyright 2012, Eyal Weiss
 * backbone.notifier.js may be freely distributed under the MIT license.
 */
(function($, Backbone, _) {
	var emptyFn = function(){},
		Notifier = Backbone.Notifier = Backbone.Model.extend({
			defaults: {
				'baseCls': 'notifier',
				types: ['warning', 'error', 'info', 'success'], // available notification styles
				'cls': null, 		// default notification style (null / 'warning' / 'error' / 'info' / 'success')
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
				'zIndex': 10000,		// minimal z-index for notifications
				'template': function(settings){     		//function(sessings){ ... return html; }
					var strBuilder =  [
						'<div class="' + settings.wrapperCls + '">',
						'<div class="' +  settings.innerCls + '">',
						'<div class="' + settings.baseCls + '-message">' + settings.message + '</div>',
						(settings.loader ? '<div class="' + settings.baseCls + '-loader"></div>' : '')
					];
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
					var o = _.extend({}, {'cls': ''}, opts);
					o['cls'] = o['cls'] ? type + ' ' + o['cls'] : type;
					return scope.notify(o);
				};

				var createNotifyFn = function(type){
					scope[type] = scope[type] || function(opts){
						notifyFn(type, opts);
					}
				};

				_.each(this.attributes.types, function(type){
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
			getWrapperCls: function(settings){
		   		return [settings.baseCls,
					   settings.cls ? settings.baseCls + '-' + settings.cls : '',
					   settings.baseCls + '-pos-' + settings.position,
					   settings.buttons ? settings.baseCls + '-block' : '',
					   settings.loader ? settings.baseCls + '-with-loader' : ''
				   ].join(' ');
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

				settings.wrapperCls = this.getWrapperCls(settings);

				settings.innerCls = settings.baseCls + '-inner';

				var msgEl = $(settings.template(settings)),
					msgInner = msgEl.find('.' + settings.innerCls);

				this.eat('beforeAppendMsgEl', settings, msgEl, msgInner);
				msgEl.css({top: settings.top - 40, opacity: 0, zIndex: settings.modal ? ++zIndex : zIndex}).prependTo(this.$el);
				var msgView = new this.NotificationView({
		    		el: msgEl
		    	});
		    	msgView.settings = settings;

				if (settings.buttons || msgInner.find('button').length) {
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

					scope.eat.call(scope, 'beforeHideMsgEl', settings, msgEl, msgInner, msgView);
					var outAnimFn = scope.transitions[settings.position].out;
					outAnimFn.call(scope, msgEl, msgInner, settings, options.fadeOutMs, function(){
						msgView.remove();
						msgView.trigger('destroyed', msgView, msgEl);
						scope.eat.call(scope, 'afterDestroyMsgEl', settings, msgEl, msgInner, msgView);
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
				settings.css && msgInner.css(settings.css);

				this.eat.call(this, 'beforeAnimateInMsgEl', settings, msgEl, msgInner, msgView);
				animateFn.call(this, msgEl, msgInner, settings, settings.fadeInMs, function(){
					scope.eat.call(scope, 'afterAnimateInMsgEl', settings, msgEl, msgInner, msgView);
				});
		    	return msgView;
		    },

			eat: function(event, settings, msgEl, msgInner, msgView){ // Triggers registered modules' events
				var obj = Notifier.prototype['@' + event];
				obj && _.each(obj, function(e, moduleName){
					e.fn.call(e.caller, this, settings, msgEl, msgInner, msgView);
				}, this);
			}
//			,
//			'@beforeAppendMsgEl': {},
//			'@beforeAnimateInMsgEl': {},
//			'@afterAnimateInMsgEl': {},
//			'@beforeHideMsgEl': {},
//			'@afterDestroyMsgEl': {}
	});


	// ====================== Modules mechanism ======================
	Notifier.getModule = function(moduleName){
		return (_.isObject(moduleName)) ? moduleName : Notifier.modules[moduleName];
	};

	Notifier.regModule = function(moduleName, m){
		if (arguments.length === 1) {
			m = $.isFunction(moduleName) ? moduleName() : moduleName;
			moduleName = m.name;
		} else {
			m = $.isFunction(m) ? m() : m;
			m.name = moduleName;
		}
		if (m.extend) {
			Notifier.prototype = $.extend(true, {}, Notifier.prototype, m.extend );
		}
		(Notifier.modules = Notifier.modules || {})[moduleName] = m;
		$.isFunction(m.register) && m.register.call(m, Notifier);
		m.enabled && Notifier.enableModule(m);
	};

	Notifier.enableModule = function(moduleName){
		var m = Notifier.getModule(moduleName);
		if (m) {
			$.each(m.events, function(k, fn){
				var arr = Notifier.prototype['@' + k] = Notifier.prototype['@' + k] || {};
				arr[m.name] = {caller: m, fn: fn};
			});
			m.enabled = true;
			$.isFunction(m.enable) && m.enable.call(m, Notifier);
			return m;
		}
		console.warn('module "'  + moduleName + '" is not registered.');
		return false;
	};

	Notifier.disableModule = function(moduleName){
		var m = Notifier.getModule(moduleName);
		if (m) {
			$.each(Notifier.modules[m.name].events, function(k, fn){
				delete Notifier.prototype['@' + k];
			});
			m.enabled = false;
			$.isFunction(m.disable) && m.disable.call(m, Notifier);
			return m;
		}
		console.warn('module "'  + moduleName + '" is not registered.');
		return false;
	};

})(jQuery, Backbone, _);