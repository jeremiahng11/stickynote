
/*--------------------- Copyright (c) 2020 -----------------------
[Master Javascript]
-------------------------------------------------------------------*/

// Default square sticky size (like a real post-it pad), in px.
var NOTE_SIZE = 200;

// Debounced auto-save so edits (move, resize, type, color, hide) persist
// automatically without spamming the server.
var autoSaveTimer = null;
var autoSaveInFlight = false;   // a save request is currently running
var autoSavePending = false;    // changes happened while a save was running
function currentBoardId() {
	// prefer the controller attribute, fall back to the active board in the sidebar
	return $('.add_note_box').attr('board_id') || $('.sidebar_drawer_box.active_note').attr('title_id');
}
function scheduleAutoSave() {
	var tid = currentBoardId();
	if (!tid) { return; }
	clearTimeout(autoSaveTimer);
	autoSaveTimer = setTimeout(function () { runAutoSave(tid); }, 600);
}
function runAutoSave(tid) {
	// never run two saves at once: a second save for a still-uncreated note
	// would insert a duplicate before the first response assigns its id
	if (autoSaveInFlight) { autoSavePending = true; return; }
	autoSaveInFlight = true;
	autoSave(tid, {
		silent: true,
		done: function () {
			autoSaveInFlight = false;
			if (autoSavePending) { autoSavePending = false; runAutoSave(tid); }
		}
	});
}

(function ($) {
	"use strict";
	/*-----------------------------------------------------
		Function  Start
	-----------------------------------------------------*/
		var stickNotes = {
			initialised: false,
			version: 1.0,
			mobile: false,
			init: function () {
				if (!this.initialised) {
					this.initialised = true;
				} else {
					return;
				}
				/*-----------------------------------------------------
					Function Calling
				-----------------------------------------------------*/
				this.preLoader();
				this.sideBarToggle();
				this.addNewTitle();
				this.colorOptions();
				this.popupFix();
			},

			/*-----------------------------------------------------
				Fix Preloader
			-----------------------------------------------------*/
			preLoader: function () {
				jQuery(window).on('load', function() {
					jQuery(".status").fadeOut();
					jQuery(".preloader").delay(350).fadeOut("slow");
				});
			},

			/*-----------------------------------------------------
				Fix Side Bar
			-----------------------------------------------------*/
			sideBarToggle: function () {
				var count = 0;
				$('.toggle_btn').on("click", function(){
					if( count == '0') {
						$('body').addClass('close_sidebar');
						count++;
					}
					else {
						$('body').removeClass('close_sidebar');
						count--;
					}		
				});
			},

			/*-----------------------------------------------------
				Fix New Note Title
			-----------------------------------------------------*/
			addNewTitle: function () {
				$(document).ready(function() {
					$(".add_new_note").click(function() { 
						$('.sidebar_drawer_box_title').html('<div class="new_note_title"><input type="text" placeholder="Enter Note Title" id="title"/><a id="note_cancel">Cancel</a>&nbsp;&nbsp;&nbsp;&nbsp;<a id="note_title">Done</a></div>');		
						$('#title').keypress(function(event){ 
							if(event.keyCode === 13){
								$('#note_title').click();
							}
						});
						$('.no_board').hide();
					});
					
					$(document).on("click","#note_cancel",function(){
						$('.new_note_title').remove();
						if(($(".sidebar_drawer_box").length)==0){
							$('.no_board').show();
						}
					});

					$(document).on("click","#note_title",function(){
						var url = window.location.href;
						if(($('#title').val())!=undefined){
							var title = $('#title').val();
							$.post(url,{title : title}, function(response){ 
								if(response.status == true){
									var addboard=	'<div class="sidebar_drawer_box" title_id='+response.data.id+'>'+
												'<span class="note_date">'+response.data.createdAt+'</span>'+
												'<span><p class="title">'+response.data.title+'</p><span>'+
												'<span class="note_count"><b>0</b> Notes</span>'+
												'<a class="sidebar_drawer_box_delete" href="javascript:void(0);"><i class="far fa-trash-alt"></i></a>'+
												'</div>'
												
									$('.note_boards').prepend(addboard);
									$(".sidebar_drawer > .note_boards > .sidebar_drawer_box > span").first().trigger("click");
									$('.new_note_title').remove();
									let typeAlert='ok';
									let message = response.message
									isValid(typeAlert,message);
								}else{
									let typeAlert='error';
									let message = response.message
									isValid(typeAlert,message);
								}								
							});
						}
					});	

					$(document).on('click', '.sidebar_drawer_box_delete',function(){ 
						var id = $(this).parents('.sidebar_drawer_box').attr('title_id');
						$('.popup_wrapper').find('.popup_info > .popup_btn.red').attr('board_id', id)
						$('.deleteBtnWrapper').click();
					});

					window.onload = function() {
						$('.sidebar_drawer_box > span').first().click();
					};

					$('.sidebar_drawer').on("click",".sidebar_drawer_box > span",function(){
						var tid = $('.sidebar_drawer_box.active_note').attr('title_id'); 
						if(tid){
							autoSave(tid, { silent: true });
						}
						var id = $(this).parents('.sidebar_drawer_box').attr('title_id'); 
						var url = window.location.href;
						$('.see_notes').show();
						$('.add_note_box').show();
						$('.see_notes').attr('notes_see', id);
						$('.add_note_box').attr('board_id',id);
						$('.sidebar_drawer_box').removeClass('active_note');
						$('.see_notes').css('opacity','0.4');
						$(this).parents('.sidebar_drawer_box').addClass('active_note');
						$.get(url+id, function(response){ 
							var resNotes = response.notesData;
							var noteTemp ='';
							for (var i = 0; i < resNotes.length; i++) {
								if(resNotes[i].visible == 1){ 
									if(resNotes[i].note == null){   
										noteTemp += '<div class="col-xl-3 col-lg-6 col-md-6 colsm-12 col-12 draggableDiv" style="position: absolute; left: '+resNotes[i].xPos+'; top: '+resNotes[i].yPos+'; width: '+(resNotes[i].width||(NOTE_SIZE+'px'))+'; height: '+(resNotes[i].height||(NOTE_SIZE+'px'))+';"><div class="note_box '+resNotes[i].color+'_wrap" text_data=\''+attrEscape(JSON.stringify(resNotes[i]))+'\'><div class="note_header"  note_header_id="'+resNotes[i].id+'"><span><a class="color_options" href="javascript:;"><i class="fas fa-palette"></i></a></span><span><a class="close_note" close_note_id="'+resNotes[i].id+'" href="javascript:;"><i class="fas fa-minus"></i></a><a class="delete_note" delete_note_id="'+resNotes[i].id+'" href="javascript:;"><i class="far fa-trash-alt"></i></a></span><div class="color_options_box"><span class="color_pink"></span><span class="color_blue"></span><span class="color_orange"></span><span class="color_brown"></span></div></div><div class="note_content"><textarea note_id="'+resNotes[i].id+'" data_color="'+resNotes[i].color+'"></textarea></div></div></div>';
									}else{
										noteTemp += '<div class="col-xl-3 col-lg-6 col-md-6 colsm-12 col-12 draggableDiv" style="position: absolute; left: '+resNotes[i].xPos+'; top: '+resNotes[i].yPos+'; width: '+(resNotes[i].width||(NOTE_SIZE+'px'))+'; height: '+(resNotes[i].height||(NOTE_SIZE+'px'))+';"><div class="note_box '+resNotes[i].color+'_wrap"  text_data=\''+attrEscape(JSON.stringify(resNotes[i]))+'\'><div class="note_header"  note_header_id="'+resNotes[i].id+'"><span><a class="color_options" href="javascript:;"><i class="fas fa-palette"></i></a></span><span><a class="close_note" close_note_id="'+resNotes[i].id+'" href="javascript:;"><i class="fas fa-minus"></i></a><a class="delete_note" delete_note_id="'+resNotes[i].id+'" href="javascript:;"><i class="far fa-trash-alt"></i></a></span><div class="color_options_box"><span class="color_pink"></span><span class="color_blue"></span><span class="color_orange"></span><span class="color_brown"></span></div></div><div class="note_content"><textarea note_id="'+resNotes[i].id+'" data_color="'+resNotes[i].color+'">'+entities(resNotes[i].note)+'</textarea></div></div></div>';
									}	
								}else{
									noteTemp += '<div class="col-xl-3 col-lg-6 col-md-6 colsm-12 col-12 draggableDiv note_close" style="position: absolute; left: '+resNotes[i].xPos+'; top: '+resNotes[i].yPos+'; width: '+(resNotes[i].width||(NOTE_SIZE+'px'))+'; height: '+(resNotes[i].height||(NOTE_SIZE+'px'))+';"><div class="note_box '+resNotes[i].color+'_wrap" text_data=\''+attrEscape(JSON.stringify(resNotes[i]))+'\'><div class="note_header"  note_header_id="'+resNotes[i].id+'"><span><a class="color_options" href="javascript:;"><i class="fas fa-palette"></i></a></span><span><a class="close_note" close_note_id="'+resNotes[i].id+'" href="javascript:;"><i class="fas fa-minus"></i></a><a class="delete_note" delete_note_id="'+resNotes[i].id+'" href="javascript:;"><i class="far fa-trash-alt"></i></a></span><div class="color_options_box"><span class="color_pink"></span><span class="color_blue"></span><span class="color_orange"></span><span class="color_brown"></span></div></div><div class="note_content"><textarea note_id="'+resNotes[i].id+'" data_color="'+resNotes[i].color+'">'+entities(resNotes[i].note)+'</textarea></div></div></div>';
									$('.see_notes').css('opacity','');
									$('.see_notes').css('pointer-events','inherit');
								}
							} 

							$(".content_inner .container-fluid .row").html(noteTemp);
							$(".content_inner .container-fluid .row").find('.col-xl-3').draggable({containment : "parent"}).on('dragstop', function( event, ui ) {
								var xpos = ui.position.left;
								var ypos = ui.position.top;
								var noteData  = $(this).find('textarea').val();
								var note = htmlEntities(noteData)
								var color = $(this).find('textarea').attr('data_color'); 
								var attr = JSON.parse($(this).find('.note_box').attr('text_data'))
								
								if(attr.id != 0){
									let data = attr
									data.note = note
									data.xPos = xpos+'px'
									data.yPos = ypos+'px'
									data.color = color
									$(this).find('.note_box').attr('text_data', JSON.stringify(data))
								}
								scheduleAutoSave();
							});
							makeNoteResizable($(".content_inner .container-fluid .row").find('.col-xl-3'));
							$('.note_close').hide();
						});
					});

					function boardIsActive(){
						return $('.sidebar_drawer').find('.sidebar_drawer_box').hasClass('active_note');
					}

					// double-click the board to drop a note where you click
					$(document).on("dblclick",".content_inner", function(e){
						if(boardIsActive()){
							var elm = $(this);
							var x = e.pageX - elm.position().left;
							var y = e.pageY - elm.position().top;
							addNoteAt(x, y);
						}
					});

					// "Add New" button: drop a note at a staggered position so many
					// notes don't stack exactly on top of each other.
					// Guard against a rapid double-click creating two notes.
					var lastAddClick = 0;
					$(document).on("click",".add_note_box", function(){
						var now = (new Date()).getTime();
						if(now - lastAddClick < 500){ return; }
						lastAddClick = now;
						if(boardIsActive()){
							var count = $('.content_inner .note_box').length;
							var offset = (count % 8) * 28;
							addNoteAt(40 + offset, 40 + offset);
						}else{
							isValid('error', 'Select or create a board first.');
						}
					});

					$(document).on("drag",".draggableDiv ", function(){
						$('.draggableDiv').css('z-index','0');
						$(this).zIndex(1);
					});

					$(document).on("dblclick",".draggableDiv ", function(e){
						e.stopPropagation();
					});

					$(document).on('keyup','textarea',function(){
						var xPos =$(this).parents('.col-xl-3').css('left');
						var yPos = $(this).parents('.col-xl-3').css('top');
						var noteData  = $(this).val(); 
						var note = htmlEntities(noteData)
						
						var color = $(this).attr('data_color'); 
						var attr = JSON.parse($(this).parents('.note_box').attr('text_data'))
						
						if(attr.id != 0){
							let data = attr
							data.note = note 
							$(this).parents('.note_box').attr('text_data', JSON.stringify(data))
						}else{
							var data = JSON.stringify({id : 0,note : note, xPos : xPos, yPos : yPos, width : $(this).parents('.col-xl-3').css('width'), height : $(this).parents('.col-xl-3').css('height'), color : color, visible : "1"})
							$(this).parents('.note_box').attr('text_data', data)
						}
						scheduleAutoSave();
					});

					$(document).on('click','.color_options_box span',function(){
						var color = $(this).attr('class');
						var attr = JSON.parse($(this).parents('.note_box').attr('text_data'))
						
						if(attr.id != 0){
							let data = attr
							data.color = color
							$(this).parents('.note_box').attr('text_data', JSON.stringify(data))
						}else{
							let data = attr
							data.color = color
							$(this).parents('.note_box').attr('text_data', JSON.stringify(data))
						}
						scheduleAutoSave();
					});

					$(document).on('click','.draggableDiv ',function(){
						$('.draggableDiv').css('z-index','0');
						$(this).zIndex(1);
						if($(this).closest('.note_box').find('.color_options_box').hasClass('show_option')){
							$(this).closest('.note_box').find('.color_options_box').removeClass('show_option');
						}
					});

					$(document).on('click','.close_note',function(){
						var xPos =$(this).parents('.col-xl-3').css('left')
						var yPos = $(this).parents('.col-xl-3').css('top')
						var noteId = $(this).attr('close_note_id');
						var color =$('.col-xl-3').find('.note_content textarea').attr('data_color');
						var note = $('.col-xl-3').find('.note_content textarea').val();
						var attr = JSON.parse($(this).parents('.note_box').attr('text_data'))
						$('.see_notes').css('opacity','');
						$('.see_notes').css('pointer-events','inherit');
						$('.see_notes').attr('title','view hidden notes');
						if(attr.id != 0){
							let data = attr
							if(data.visible == 1){
								data.visible = 0
							}
							$(this).parents('.draggableDiv ').addClass('note_close');
							$('.note_close').hide();
							$(this).parents('.note_box').attr('text_data', JSON.stringify(data))
						}else{
							var data = JSON.stringify({id : noteId,note : note, xPos : xPos, yPos : yPos, width : $(this).parents('.col-xl-3').css('width'), height : $(this).parents('.col-xl-3').css('height'), color : color,visible:0})
							$(this).parents('.draggableDiv ').addClass('note_close');
							$('.note_close').hide();
							$(this).parents('.note_box').attr('text_data', data)
						}
						scheduleAutoSave();
					});

					$(document).on('click','.delete_note',function(){
						var id = $('.add_note_box').attr('board_id');
						var noteId = $(this).attr('delete_note_id');
						if(noteId==undefined){
							$(this).parents('.note_box').addClass('noteDelete')
							$('.popup_wrapper').find('.popup_info > .popup_btn.red').attr('board_id', '0')
						}else{
							$(this).parents('.note_box').addClass('noteDelete')
							$('.popup_wrapper').find('.popup_info > .popup_btn.red').attr('note-id', noteId);
							$('.popup_wrapper').find('.popup_info > .popup_btn.red').attr('board_id', id);
						}
						$('.deleteBtnWrapper').click();
					});

					$(document).on('click','.see_notes',function(){	
						$('.see_notes').css('opacity','0.4');
						$('.see_notes').attr('title','no hidden notes')
						$('.note_close').each(function(i,v){

							var attr = JSON.parse($(this).find('.note_box').attr('text_data'))
							if(attr.id != 0){
								var data = attr								
								if(data.visible == 0){
									data.visible = 1
								}
								$(this).find('.note_box').attr('text_data', JSON.stringify(data))
								$('.draggableDiv').removeClass('note_close');
								$('.draggableDiv').show();
							}
						});
						scheduleAutoSave();
					});

				});
			},

			/*-----------------------------------------------------
				Fix color options
			-----------------------------------------------------*/
			colorOptions: function () {
			   	$(document).on('click','.color_options',function(){ 
				   	if($(this).closest('.note_box').find('.color_options_box').hasClass('show_option')){
						$(this).closest('.note_box').find('.color_options_box').removeClass('show_option');
					}else{
						$('.color_options').closest('.note_box').find('.color_options_box').removeClass('show_option');
						$(this).closest('.note_box').find('.color_options_box').addClass('show_option');
					}
				});

				$(document).on('click','.color_pink',function(e){
					event.stopPropagation();
					$(this).closest(".note_box").find('.note_content textarea').attr('data_color', "color_pink");
					$(this).closest(".note_box").addClass("color_pink_wrap");
					$(this).closest(".note_box").removeClass("color_blue_wrap");
					$(this).closest(".note_box").removeClass("color_orange_wrap");
					$(this).closest(".note_box").removeClass("color_brown_wrap");
					$(this).closest('.note_box').find('.color_options_box').removeClass('show_option');
				});	
				
				$(document).on('click','.color_blue',function(e){
					event.stopPropagation();
					$(this).closest(".note_box").find('.note_content textarea').attr('data_color', "color_blue");
					$(this).closest(".note_box").addClass("color_blue_wrap");
					$(this).closest(".note_box").removeClass("color_pink_wrap");
					$(this).closest(".note_box").removeClass("color_orange_wrap");
					$(this).closest(".note_box").removeClass("color_brown_wrap");
					$(this).closest('.note_box').find('.color_options_box').removeClass('show_option');
				});	

				$(document).on('click','.color_orange',function(e){
					event.stopPropagation();
					$(this).closest(".note_box").find('.note_content textarea').attr('data_color', "color_orange");
					$(this).closest(".note_box").addClass("color_orange_wrap");
					$(this).closest(".note_box").removeClass("color_pink_wrap");
					$(this).closest(".note_box").removeClass("color_blue_wrap");
					$(this).closest(".note_box").removeClass("color_brown_wrap");
					$(this).closest('.note_box').find('.color_options_box').removeClass('show_option');
				});	

				$(document).on('click','.color_brown',function(e){
					event.stopPropagation();
					$(this).closest(".note_box").find('.note_content textarea').attr('data_color', "color_brown");
					$(this).closest(".note_box").addClass("color_brown_wrap");
					$(this).closest(".note_box").removeClass("color_pink_wrap");
					$(this).closest(".note_box").removeClass("color_blue_wrap");
					$(this).closest(".note_box").removeClass("color_orange_wrap");
					$(this).closest('.note_box').find('.color_options_box').removeClass('show_option');
				});

				$(".content_inner").on('click',function(e){
					if($('.color_options').closest('.note_box').find('.color_options_box').hasClass('show_option')){
						$('.color_options').closest('.note_box').find('.color_options_box').removeClass('show_option');
					}
				});
			},

			/*-----------------------------------------------------
    			Fix Upload Image
    		-----------------------------------------------------*/
    		
    		popupFix: function () {
				$('.close_btn').on("click", function () {
					$('.popup_container').removeClass('show');
				});
				$('.popup_container').on("click", function () {
					$('.popup_container').removeClass('show');
				});
				$(".popup_containerinner").on('click', function () {
					event.stopPropagation();
				});

				// Info Popup
				$('.infoPopUp').on("click", function () {
					$('.infoPopUpWrapper').addClass('show');
				});

				// Delete Popup
				$('.deleteBtnWrapper').on("click", function () {
					$(this).addClass('show');
				});

				$('.popup_btn.red').on("click", function () {
					var noteId = $('.popup_wrapper').find('.popup_info > .popup_btn.red').attr('note-id');
					var id = $('.popup_wrapper').find('.popup_info > .popup_btn.red').attr('board_id');
					var url = window.location.href;

					if(id==0){
						$('.noteDelete').parents('.draggableDiv').remove();
						$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('board_id');
						$('.deleteBtnWrapper').removeClass('show');
					}else{
						if(id && noteId){
							$.post(url+id,{id : noteId},function(response){ 
								if(response.status == true){
									$(".sidebar_drawer > .active_note").find("span").trigger("click");
									$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('note-id');
									$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('board_id');
									$(".sidebar_drawer_box.active_note > .note_count b").html(($(".note_box").length)-1);
									$('.noteDelete').parents('.draggableDiv').remove();
									let typeAlert='ok';
									let message = response.message
									isValid(typeAlert,message);
									$('.deleteBtnWrapper').removeClass('show');
								}else{
									let typeAlert='error';
									let message = response.message
									isValid(typeAlert,message);
								}
							});
						}else{
							$.post(url+'boardDelete/'+id,function(response){ 
								if(response.status == true){
									let typeAlert='ok';
									let message = response.message
									isValid(typeAlert,message);
									$('.deleteBtnWrapper').removeClass('show');
									setTimeout(function(){
										window.location.href='/stickyBoard/'
									},300)
									if(($(".sidebar_drawer_box").length)==0){
										$('.no_board').show();
									}
								}else{
									let typeAlert='error';
									let message = response.message
									isValid(typeAlert,message);
								}
							});
						}
					}
				});

				$('.popup_btn.skyBlue').on("click", function () {
					if(($('.draggableDiv > .note_box').hasClass('noteDelete'))==true){
						$('.draggableDiv > .note_box').removeClass('noteDelete');
					}
					$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('note-id');
					$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('board_id');
					$('.deleteBtnWrapper').removeClass('show');
				});

				$('.close_btn').on("click", function () {
					if(($('.draggableDiv > .note_box').hasClass('noteDelete'))==true){
						$('.draggableDiv > .note_box').removeClass('noteDelete');
					}					
					$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('note-id');
					$('.popup_wrapper').find('.popup_info > .popup_btn.red').removeAttr('board_id');
				})
			},
		};

		stickNotes.init();

})(jQuery);

/*-----------------------------------------------------
	Fix Toastr
-----------------------------------------------------*/
function isValid(typeAlert,message) { 
	if(typeAlert=='ok')
	{
		$('.msg').addClass('alert_open');
		$('.msg').addClass('note_success');
		$(".alert_text").text(message);
		setTimeout(function(){ $('.msg').removeClass('alert_open'); }, 3000);
		setTimeout(function(){ $('.msg').removeClass('note_success'); }, 3000);
	}
	else
	{
		$('document').ready(function(){
			$('.msg').addClass('alert_open');
			$('.msg').addClass('note_error');
			$(".alert_text").text(message);
			setTimeout(function(){ $('.msg').removeClass('alert_open'); }, 3000);
			setTimeout(function(){ $('.msg').removeClass('note_error'); }, 3000);
		});
	}
}

$('#note_success').click(function(){
	isValid('#send','ok');
});

$('#note_error').click(function(){
	isValid('#send');
});

/*-----------------------------------------------------
	Make sticky notes resizable by dragging any edge/corner
-----------------------------------------------------*/
function makeNoteResizable($cols) {
	$cols.each(function () {
		var $col = $(this);
		if ($col.data('resizable-init')) { return; }
		$col.data('resizable-init', true);
		$col.resizable({
			handles: "n, e, s, w, ne, se, sw, nw",
			minWidth: 140,
			minHeight: 120,
			stop: function (event, ui) {
				var $box = $(this).find('.note_box');
				if (!$box.attr('text_data')) { return; }
				var attr = JSON.parse($box.attr('text_data'));
				attr.width = Math.round(ui.size.width) + 'px';
				attr.height = Math.round(ui.size.height) + 'px';
				$box.attr('text_data', JSON.stringify(attr));
				// auto-save the new size
				scheduleAutoSave();
			}
		});
	});
}

// Create a new sticky note at (x, y) within the active board and return it.
// Shared by double-click and the "Add New" button so any number can be added.
function addNoteAt(x, y) {
	var note = {
		id: 0, note: "", xPos: x + 'px', yPos: y + 'px',
		width: NOTE_SIZE + 'px', height: NOTE_SIZE + 'px',
		color: "color_blue", visible: "1"
	};
	var html = '<div class="col-xl-3 col-lg-6 col-md-6 colsm-12 col-12 draggableDiv" style="position:absolute; left:' + x + 'px; top:' + y + 'px; width:' + NOTE_SIZE + 'px; height:' + NOTE_SIZE + 'px;">'
		+ '<div class="note_box" text_data=\'' + attrEscape(JSON.stringify(note)) + '\'>'
		+ '<div class="note_header">'
		+ '<span><a class="color_options" href="javascript:void(0);"><i class="fas fa-palette"></i></a></span>'
		+ '<span><a class="close_note" href="javascript:void(0);"><i class="fas fa-minus"></i></a><a class="delete_note" href="javascript:void(0);"><i class="far fa-trash-alt"></i></a></span>'
		+ '<div class="color_options_box"><span class="color_pink"></span><span class="color_blue"></span><span class="color_orange"></span><span class="color_brown"></span></div>'
		+ '</div>'
		+ '<div class="note_content"><textarea data_color="color_blue"></textarea></div>'
		+ '</div></div>';

	var $note = $(html).hide();
	$note.appendTo(".content_inner .container-fluid .row").show("fade", 300);
	$note.draggable({ containment: "parent" }).on('dragstop', function (e, ui) {
		var xPos = ui.position.left;
		var yPos = ui.position.top;
		var color = $(this).find('.note_content textarea').attr('data_color');
		var noteData = $(this).find('.note_content textarea').val();
		var noteText = htmlEntities(noteData);
		var attr = JSON.parse($(this).find('.note_box').attr('text_data'));
		if (attr.id != 0) {
			attr.note = noteText; attr.xPos = xPos + 'px'; attr.yPos = yPos + 'px'; attr.color = color;
			$(this).find('.note_box').attr('text_data', JSON.stringify(attr));
		} else {
			var data = JSON.stringify({ id: 0, note: noteText, xPos: xPos + 'px', yPos: yPos + 'px', width: $(this).css('width'), height: $(this).css('height'), color: color, visible: "1" });
			$(this).find('.note_box').attr('text_data', data);
		}
		scheduleAutoSave();
	});
	makeNoteResizable($note);
	$note.find('textarea').focus();
	// persist the new note right away so it survives a reload even before editing
	scheduleAutoSave();
	return $note;
}

// Escape a string for safe embedding inside an HTML attribute. Escaping '&'
// first is essential: note text is stored with entities like &quot;, and without
// this the browser would decode them back into raw quotes and corrupt the JSON.
function attrEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&eq;');
}

function entities(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&eq;/g,"'");
}

function autoSave(tid, opts){
	opts = opts || {};
	var url = window.location.href;

	var arr = [];
	var newBoxes = [];   // note_box elements that are not yet in the DB (id == 0)

	$('.note_box').each(function(){
		var td = $(this).attr('text_data');
		if(td != null){
			arr.push(td);
			try{ if(JSON.parse(td).id == 0){ newBoxes.push($(this)); } }catch(e){}
		}
	});
	var data = JSON.stringify(arr)
	$.post(url+tid,{data : data} , function(response){
		if(response.status == true){
			// adopt the DB-assigned ids for the newly created notes so the next
			// save updates them instead of inserting duplicates
			if(response.created && response.created.length){
				for(var i=0; i<newBoxes.length && i<response.created.length; i++){
					var $box = newBoxes[i];
					var newId = response.created[i];
					try{
						var attr = JSON.parse($box.attr('text_data'));
						attr.id = newId;
						$box.attr('text_data', JSON.stringify(attr));
					}catch(e){}
					$box.find('.note_content textarea').attr('note_id', newId);
					$box.find('.note_header').attr('note_header_id', newId);
					$box.find('.close_note').attr('close_note_id', newId);
					$box.find('.delete_note').attr('delete_note_id', newId);
				}
			}

			$(".sidebar_drawer_box").each(function(){
				if(($(this).attr('title_id'))==tid){
					$(this).find(".note_count b").html($(".note_box").length);
				}
			});

			if(!opts.silent){
				isValid('ok', response.message);
			}
		}else{
			isValid('error', response.message + (response.error ? ' ('+response.error+')' : ''));
		}
	}).always(function(){
		if(typeof opts.done === 'function'){ opts.done(); }
	});
}