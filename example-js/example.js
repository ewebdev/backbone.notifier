$(function(){

	var notifier = window.notifier = new Backbone.Notifier({
		ms: 5000,
		caller: 'examples',
		theme: 'clean'
	});

	var supports3d = !($.browser.msie && $.browser.version < 9);
	!supports3d && $('#notSupported3d').show();

	var updateUIState = function(moduleBlock, enabled){
		var moduleName = moduleBlock.data('module');
		moduleBlock.find('[data-text-0]').each(function(){
			var $e = $(this);
			$e.text($e.data('text-' + (enabled ? 1 : 0)));
		});
		moduleBlock.find('button').data({'toggle-to': !enabled, module: moduleName});
	};
	var toggleState = function(){
		var $btn = $(this),
			moduleBlock = $btn.closest('.module-toggle-block'),
			active = $btn.data('toggle-to'),
			moduleName = $btn.data('module');

		Backbone.Notifier[active ? 'enableModule' : 'disableModule' ](moduleName);
		notifier[active ? 'success' : 'error']({
			title: moduleName + ' module',
			message: moduleName + ' module is now ' +
				(active ?
					('<strong>enabled</strong>.' + (moduleBlock.data('msg-enable') || ''))
					: '<strong>disabled</strong>.'),
			position: 'center',
			modal: true,
			ms: -1,
			hideOnClick: true,
			destroy: true,
			buttons: [
				{'data-role': 'ok', text: 'Dismiss'}
			]
		});
		updateUIState(moduleBlock, active);
	};

	$('#modules').on('click', 'button.btn-module', toggleState);
	var moduleBlocks = $('.module-toggle-block');
	moduleBlocks.each(function(){
		var moduleBlock = $(this),
			moduleName = moduleBlock.data('module'),
			module = Backbone.Notifier.getModule(moduleName);
		if (module) {
			updateUIState(moduleBlock, module.enabled);
		} else {
			moduleBlock.find('.module-state-controls').hide();
			moduleBlock.append('<div class="alert alert-error">Module "' + moduleName + '" was not loaded!</div>');
//			console.log('module ' + moduleName + ' was not loaded!');
		}
	});

	$('.btns-block').on('click', '.runnable', function(){
		eval($(this).text());
	});

	$('pre.runnable').each(function(){
		$(this).data('code',
			$(this).text()
				.replace(/<strong>/ig,'')
				.replace(/<\/strong>/ig,'')
				.replace(/&lt;/ig,'<')
				.replace(/&gt;/ig,'>')
		).addClass('prettyprint lang-js');
	});

	$('.code-wrapper button.run').click(function(){
		var js = $(this).closest('.code-wrapper').find('pre.runnable').data('code');
		eval(js);
	});

	var floatBarPh = $('#floatBarPh'),
		floatBar = floatBarPh.children('div'),
		barH =  floatBar.height(),
		curPos = 'fixed',
		pageH,
		fTop;
	var updatePos = function(){
		pageH = $(window).height();
		fTop = floatBarPh.position().top;
	};
	$(window).resize(updatePos);
	updatePos();

	$(window).scroll(function(){
		var cvPos = $(window).scrollTop();
		if (cvPos > fTop - pageH + barH) {
			if (curPos !== 'absolute') {
				curPos = 'absolute';
				floatBar.css({position: curPos}).addClass('in-place');
			}
		} else {
			if (curPos !== 'fixed') {
				curPos = 'fixed';
				floatBar.css({position: curPos}).removeClass('in-place');
			}
		}
	});

	$('.more').on('click', function(event){
		event.preventDefault();
		var t =$($(this).attr('href'));
		t.length && $('html,body').animate({scrollTop:t.offset().top-20}, 1000);
	});

	var themeNotifier = new Backbone.Notifier({
		hideOnClick: false,
		modal: false,
		zIndex: 9999999,
		ms: null,
		theme: 'clean'
	});

	var onTourEnd = function(){
		$('.after-tour').fadeIn(2000);
		notifier.destroyAll('section', 'tour');
		themeNotifier.destroyAll(true);
	};

	var quitTour = function(){
		this.destroy();
		onTourEnd();
	};

	var showThemeChooser = function(options){
		var chooser = themeNotifier.notify({
			message: 'Set theme',
			position: options.position || 'top',
			cls: options.cls,
			destroy: options.destroy,
			modal: options.modal,
			fadeOutMs: 0,
			fadeInMs: 0,
			buttons: [
				{'data-role': 'plastic', text: 'Plastic', 'class': notifier.attributes.theme === 'plastic' ? 'default active' : ''},
				{'data-role': 'clean', text: 'Clean', 'class': notifier.attributes.theme === 'clean' ? 'default active' : ''}
			]
		});
		chooser.$el.find('>div').on('click', 'button', function(){
			var btn = $(this),
				theme = btn.data('role');
			chooser.trigger('done');
			notifier.trigger('themechosen', theme);
			btn.addClass('default active').siblings().removeClass('default active');
		});
		return chooser;
	};

	var setTheme = function(theme){
		this.set('theme', theme);
		_.each(this.current, function(a){
			a.settings.theme = theme;
			a.$el.attr('class', notifier.getWrapperCls(a.settings));
			notifier.transitions[a.settings.position]['in'].call(a, a.$el, a.$el.find('>div'), a.settings, a.settings.fadeInMs);
			a.screenEl && a.screenEl.attr('class', a.settings.baseCls + '-screen ' + a.settings.baseCls + '-theme-' + theme);
		});
	};
	notifier.on('themechosen', function(theme){
		setTheme.call(notifier, theme);
		setTheme.call(themeNotifier, theme);
	});

	var tour = function(){

		notifier.notify({
			message: "Hi, would you like really a quick tour?",
			type: "info",
			buttons: [
				{'data-role': 'ok', text: 'Yes!', 'class': 'default'},
				{'data-role': 'cancel', text: 'Not now'}
			],
			hideOnClick: false,
			modal: false,
			section: 'tour',
			ms: 10000
		})
			.on('click:ok', function(){
				this.destroy();
				showThemeChooser({position: 'bottom'});

				notifier.notify({
					message: "Backbone.Notifier support different styles and positions,<br />which are fully customizable. <strong>Wanna see more?</strong>",
					type: 'warning',
					position: 'center',
					modal: true,
					ms: false,
					section: 'tour',
					buttons: [
						{'data-role': 'ok', text: 'Sure!', 'class': 'default'},
						{'data-role': 'cancel', 'class': 'link', text: 'No, I think I\'ve got it'}
					]
				})
					.on('click:ok', function(){
						this.destroy();

						notifier.notify({
							type: 'info',
							title: "Information",
							message: "This is a 'dialog' <em>info</em> notification. Dialog-styled notifications are also available in the same all types, and creating new types doens't require extra css for dialogs.",
							section: 'tour',
							buttons: [
								{'data-role': 'ok', text: 'Continue the tour', 'class': 'default'},
								{'data-role': 'cancel', 'class': 'link', text: 'Skip tour'}
							],
							modal: true,
							ms: null
						})
							.on('click:ok', function(){

								notifier.notify({
									message: 'We got loaders...',
									loader: true,
									modal: true,
									section: 'tour',
									hideOnClick: true,
									ms: 3500
								}).on('destroy', function(){
										var msg3d = supports3d ? '<strong>You can now see our <em>3D module</em> in action.</strong>' : '';
										Backbone.Notifier.enableModule('3d');
										notifier.notify({
											title: 'Almost Done...',
											destroy: true,
											'3d': true,
											message: 'Backbone.Notifier can be can be easily extended thanks to smart modules architecture.<br />' + msg3d,
											buttons: [
												{text: 'Dismiss', 'class': 'default'}
											],
											type: 'success',
											position: 'center',
											section: 'tour',
											modal: true,
											hideOnClick: true,
											ms: false
										})
											.on('destroy', function(){
												Backbone.Notifier.disableModule('3d');

												notifier.notify({
													message: "And there's so much more... <strong>Thanks for taking the tour.</strong><br /><em>Don't forget to tweet if you appreciate the work...!</em>",
													buttons: [
														{'data-role': 'dismiss', text: 'Dismiss', 'class': 'default'}
													],
													type: 'success',
													destroy: true,
													section: 'tour',
													modal: true,
													hideOnClick: false,
													ms: 15000
												})
													.on('click:dismiss', 'destroy')
													.on('destroy', onTourEnd);

												setTimeout(function(){
													notifier.notify({
														modal: true,
														screenOpacity:.7,
														message: 'Features useful event mechanism with great API',
														type: 'error',
														section: 'tour',
														hideOnClick: true,
														position: 'center',
														ms: 3500
													});
												}, 300);

											});


									});

							})
							.on('click:cancel', quitTour);

					})
					.on('click:cancel', quitTour);

			})
			.on('click:cancel timeout', quitTour);

	};

	tour();
	$('#btnTour').click(tour);
	$('#btnTheme').click(function(){
		showThemeChooser({modal: true}).on('done', function(){
			this.destroy();
			notifier.success({message: 'Theme was set', destroy: true});
		});
	});

	$('#installation').on('click', '.theme-demo', function(){
		var theme = $(this).data('theme');
		notifier.info({
			message: 'This notification is using the theme "' + theme + '"',
			modal: false,
			theme: theme,
			destroy: true
		});
		return false;
	});
	window.prettyPrint();

	var commitModel = Backbone.Model.extend({
		author: undefined,
		commit: undefined,
		committer: undefined,
		url: undefined,
		sha: undefined
	});
	var Commits = Backbone.Collection.extend({
		model: commitModel
	});
	var CommitsView = Backbone.View.extend({
		initialize: function(){
			this.loader = new Backbone.Notifier({
				el: this.$el,
				position: 'center',
				loader: true,
				message: 'loading...',
				ms: null,
				modal: true,
				theme: 'plastic',
				'out': function(el, inner, options, duration, callback){
					el.fadeOut(duration, callback);
				}
			});
			this.loader.notify();
			window.parseCommitHistory = $.proxy(this.parseResponse, this);
			jQuery.ajax({
				url: 'https://api.github.com/repos/ewebdev/backbone.notifier/commits?callback=parseCommitHistory',
				dataType: "jsonp",
				jsonp: true
			});
		},
		parseResponse: function(obj){
			this.collection = new Commits(obj.data);
			this.render();
		},
		limit: 5,
		template: function(data){
			var html = '',
				prevVerList = '';
			_.each(data.first(this.limit), function(item) {
				var commit = '';
				commit += '<div class="row release-changes">';
					var date = new Date(item.attributes.commit.committer.date);
				commit += '<div class="span3">' +  date.toLocaleDateString() +' ' + date.toLocaleTimeString() + '</div>' +
					'<div class="span7"><ul>';
				var s = item.attributes.commit.message.split('\n'),
					verList = '';
				_.each(s, function(l) {
					var change = l.replace(/^-\s?(.*)$/ig, '$1').trim();
					if (change.toLowerCase().substr(0, 2) === '//') {
						return false;
					}
					if (change.toLowerCase().substr(0, 7) === 'version') {
						verList = '<li class="ver">' + change  + '</li>' + verList;
					} else if (change && change.length) {
						verList +=	'<li>' + change + '</li>';
					}
				});
				commit += verList + '</ul>' +
				'</div>' +
				'</div>';
				html += (verList && (prevVerList !== verList)) ? commit : '';
				prevVerList = verList;
			});
			return html;
		},
		render: function(){
			var html = this.template.call(this, this.collection);
			var ph = this.$el.find('.log-content').css({opacity: 0}).html(html);
			var targetH = ph.height() - 50;
			this.$el.animate({height: '+=' + targetH}, 800, updatePos);
			ph.animate({opacity: 1}, 800);
			this.loader.destroyAll();
			return this;
		}
	});
	new CommitsView({el: $('#changelog')});

});
