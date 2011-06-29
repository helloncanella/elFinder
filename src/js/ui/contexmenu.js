"use strict"
$.fn.elfindercontextmenu = function(fm) {
	
	return this.each(function() {
		var event = $.browser.opera ? 'click' : 'contextmenu',
			itemclass = 'elfinder-contextmenu-item',
			groupclass = 'elfinder-contextmenu-group',
			subclass   = 'elfinder-contextmenu-sub',
			subpos     = fm.direction == 'ltr' ? 'left' : 'right',
			menu = $(this).addClass('ui-helper-reset ui-widget ui-state-default ui-corner-all elfinder-contextmenu elfinder-contextmenu-'+fm.direction)
				.hide()
				.appendTo('body')
				.delegate('.'+itemclass, 'hover', function() {
					var item = $(this).toggleClass('ui-state-hover');
					item.is('.'+groupclass) && item.children('.'+subclass).toggle()
					
				})
				.delegate('.'+itemclass, 'click', function(e) {
					var item = $(this),
						data = item.data();

					e.preventDefault();
					e.stopPropagation();

					if (!item.is('.'+groupclass)) {
						data && data.cmd && fm.exec(data.cmd, menu.data('targets'), data.variant, true);
						close();
					}
				}),
			options = $.extend({navbar : [], cwd : []}, fm.options.contextmenu),
			/**
			 * Append items to menu
			 *
			 * @param String  menu type (navbar/cwd)
			 * @param Array   files ids list
			 * @return void
			 **/
			append = function(type, targets) {
				var commands = options[type], 
					sep = false;

				menu.text('').data('targets', targets);

				$.each(commands, function(i, name) {
					var cmd = fm.command(name),
						item, sub;

					if (!(cmd && cmd.name)) {
						if (name == '|' && sep) {
							menu.append('<div class="elfinder-contextmenu-separator"/>');
							sep = false;
						}
						return;
					}
					
					if (cmd.getstate(targets) == -1) {
						return;
					}
					
					item = $('<div class="'+itemclass+'"><span class="elfinder-button-icon elfinder-button-icon-'+cmd.name+' elfinder-contextmenu-icon"/><span>'+cmd.title+'</span></div>')
						.data({cmd : cmd.name});

					
					if (cmd.variants) {

						sub = $('<div class="ui-corner-all '+subclass+'"/>')
							.appendTo(item.addClass(groupclass).append('<span class="ui-icon ui-icon-triangle-1-e"/>'));
							
						$.each(cmd.variants, function(i, variant) {
							sub.append($('<div class="'+itemclass+'"><span>'+variant[1]+'</span></div>')
								.data({cmd : cmd.name, variant : variant[0]}));
						});
					}
					
					menu.append(item);
					sep = true;
				});
			},
			/**
			 * Close menu and empty it
			 *
			 * @return void
			 **/
			close = function() {
				menu.hide().text('').removeData('targets');
			},
			/**
			 * Open menu in required position
			 *
			 * @param Number  left offset
			 * @param Number  top offset
			 * @return void
			 **/
			open = function(x, y) {
				var win        = $(window),
					width      = menu.outerWidth(),
					height     = menu.outerHeight(),
					wwidth     = win.width(),
					wheight    = win.height(),
					scrolltop  = win.scrollTop(),
					scrollleft = win.scrollLeft(),
					css        = {
						top  : (y + height  < wheight ? y : y - height) + scrolltop,
						left : (x + width < wwidth ? x : x - width) + scrollleft,
						'z-index' : 100 + fm.getUI('workzone').zIndex()
					};

				if (!menu.children().length) {
					return;
				}
				
				menu.css(css).show();
				
				css = {'z-index' : css['z-index']+10};
				css[subpos] = parseInt(menu.width());
				menu.find('.elfinder-contextmenu-sub').css(css);
			},
			cwd, nav;

		fm.one('load', function() {
			
			cwd = fm.getUI('cwd').bind(event, function(e) {
				var target  = $(e.target),
					file    = target.closest('.elfinder-cwd-file'),
					targets = [],
					type    = 'files';

				e.preventDefault();
				
				if (file.length) {
					// do not show menu on disabled files
					if (file.is('.ui-state-disabled')) {
						return;
					}
					cwd.trigger('selectfile', file.attr('id'));
					targets = fm.selected();
				} else {
					cwd.trigger('unselectall');
					targets.push(fm.cwd().hash);
					type = 'cwd';
				}

				append(type, targets);
				open(e.clientX, e.clientY);
			})
			
			fm.getUI('nav').bind(event, function(e) {
				var target  = $(e.target),
					targets = [];

				if (target.is('.elfinder-navbar-dir,.elfinder-navbar-dir-wrapper')) {
					e.preventDefault();
					if (target.is('.elfinder-navbar-dir-wrapper')) {
						target = target.children();
					}
					targets.push(fm.navId2Hash(target.attr('id')))
					
					append('navbar', targets);
					open(e.clientX, e.clientY);
				}

			})
			
			fm.select(close).getUI().click(close);

		}).one('destroy', function() {
			menu.remove();
		});
		
	});
}