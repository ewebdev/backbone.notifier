$(function(){

	var notifier = window.notifier = new Backbone.Notifier({
		ms: 5000
	});


	if ($.browser.msie && $.browser.version < 9) {
		$('#notSupported3d').show();
	}


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
			message: moduleName + " module is now " +
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

	var tour = function(){


		notifier.notify({
			message: "Hi, would you like really a quick tour?",
			cls: "info",
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
					message: "You can set different styles and positions. Wanna see more?",
					cls: 'warning',
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
							message: 'It is very flexible and customizable.',
							loader: true,
							modal: true,
							hideOnClick: true,
							ms: 3500
						}).on('destroyed', function(){

								notifier.notify({
									message: 'Supports multiple notifications and much more...<br /> <strong>Thanks for taking the tour!</strong>',
									buttons: [
										{'data-role': 'dismiss', text: 'Dismiss', 'class': 'default'}
									],
									cls: 'success',
									modal: true,
									hideOnClick: false,
									ms: false
								})
									.on('click:dismiss', 'destroy')
									.on('destroyed', onTourEnd);

								setTimeout(function(){
									notifier.notify({
										modal: true,
										message: 'Includes useful event mechanism with great API.',
										cls: 'error',
										hideOnClick: true,
										ms: 3500
									});
								}, 300);



							});
					})
					.on('click:cancel', function(){
						this.destroy();
						onTourEnd();
					});

			})
			.on('click:cancel timeout', function(){
				this.destroy();
				onTourEnd();
			});

	};

	tour();
	$('#btnTour').click(tour);
	window.prettyPrint();

});