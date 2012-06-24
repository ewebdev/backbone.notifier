$(function(){

	var notifier = window.notifier = new Backbone.Notifier({
		ms: 5000
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
			console.log('module ' + moduleName + ' was not loaded!');
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


	var onTourEnd = function(){
		$('#btnTour').fadeIn(2000);
	};

	var quitTour = function(){
		this.destroy();
		onTourEnd();
	};

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
			ms: 10000
		})
			.on('click:ok', function(){
				this.destroy();

				notifier.notify({
					message: "Backbone.Notifier support different styles and positions,<br />which are fully customizable. <strong>Wanna see more?</strong>",
					type: 'warning',
					position: 'center',
					modal: true,
					ms: false,
					buttons: [
						{'data-role': 'ok', text: 'Sure!', 'class': 'default'},
						{'data-role': 'cancel', text: 'No, I think I\'ve got it'}
					]
				})
					.on('click:ok', function(){
						this.destroy();

						      notifier.notify({
								  type: 'info',
								  title: "Information",
								  message: "This is a 'dialog' <em>info</em> notification. Dialog-styled notifications are also available in the same all types, and creating new types doens't require extra css for dialogs.",
								  buttons: [
									  {'data-role': 'ok', text: 'Continue the tour', 'class': 'default'},
									  {'data-role': 'cancel', text: 'Let me go'}
								  ],
								  modal: true,
								  ms: null
							  })
							  .on('click:ok', function(){

									  notifier.notify({
										  message: 'We got loaders...',
										  loader: true,
										  modal: true,
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
	window.prettyPrint();

});