(function($)
{
    /**
     * Auto-growing textareas; technique ripped from Facebook
     *
     * https://github.com/jaz303/jquery-grab-bag/tree/master/javascripts/jquery.autogrow-textarea.js
     */
    $.fn.autogrow = function(options)
    {
        return this.filter('textarea').each(function()
        {
            var self         = this;
            var $self        = $(self);
            var minHeight    = $self.height();
            var noFlickerPad = $self.hasClass('autogrow-short') ? 0 : parseInt($self.css('lineHeight')) || 0;

            var shadow = $('<div></div>').css({
                position:    'absolute',
                top:         -10000,
                left:        -10000,
                width:       $self.width(),
                fontSize:    $self.css('fontSize'),
                fontFamily:  $self.css('fontFamily'),
                fontWeight:  $self.css('fontWeight'),
                lineHeight:  $self.css('lineHeight'),
                resize:      'none',
                'word-wrap': 'break-word'
            }).appendTo(document.body);

            var update = function(event)
            {
                var times = function(string, number)
                {
                    for (var i=0, r=''; i<number; i++) r += string;
                    return r;
                };

                var val = self.value.replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/&/g, '&amp;')
                                    .replace(/\n$/, '<br/>&nbsp;')
                                    .replace(/\n/g, '<br/>')
                                    .replace(/ {2,}/g, function(space){ return times('&nbsp;', space.length - 1) + ' ' });

                // Did enter get pressed?  Resize in this keydown event so that the flicker doesn't occur.
                if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13) {
                    val += '<br />';
                }

                shadow.css('width', $self.width());
                shadow.html(val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.
            }

            $self.change(update).keyup(update).keydown({event:'keydown'},update);
            $(window).resize(update);

            update();
        });
    };
})(jQuery);

var noteTemp =  '<div class="col-xl-3 col-lg-6 col-md-6 colsm-12 col-12 draggableDiv" style="position:absolute;left:#XPOS#px;top:#YPOS#px;z-index:#ZINDEX#">'
                +	'<div class="note_box" text_data={"id":0,"note":"","xPos":"#XPOS#px","yPos":"#YPOS#px","color":"color_blue","visible":"1"}>'
                +		'<div class="note_header">'
                +			'<span>'
                +				'<a class="color_options" href="javascript:void(0);">'
                +					'<i class="fas fa-palette"></i>'
                +				'</a>'
                +			'</span>'
                +			'<span>'
                +				'<a class="close_note" href="javascript:void(0);">'
                +					'<i class="fas fa-minus"></i>'
                +				'</a>'
                +				'<a class="delete_note" href="javascript:void(0);">'
                +					'<i class="far fa-trash-alt"></i>'
                +				'</a>'
                +			'</span>'
                +			'<div class="color_options_box">'
                +				'<span class="color_pink"></span>'
                +				'<span class="color_blue"></span>'
                +				'<span class="color_orange"></span>'
                +				'<span class="color_brown"></span>'
                +           '</div>'
                +		'</div>'
                +		'<div class="note_content">'
                +			'<textarea data_color="color_blue"></textarea>'
                +		'</div>'
                +	'</div>'
                +'</div>';

function deleteNote(){
    $(this).parent('.draggableDiv').hide("puff",{ percent: 133}, 250);
};

function newNote() {
    let xPos = randomNumber(10,100);
    let yPos = randomNumber(10,100);

    noteTemp1 = noteTemp.replace(/#XPOS#/g,xPos)
    noteTemp1 = noteTemp1.replace(/#YPOS#/g,yPos)
    noteTemp1 = noteTemp1.replace("#ZINDEX#",1)
    
    $('.draggableDiv').css('z-index','0');
    
    $(noteTemp1).hide().appendTo(".content_inner .container-fluid .row").show("fade", 300).draggable({containment : "parent"});
    $(".content_inner .container-fluid .row").find('.col-xl-3').draggable({containment : "parent"}).on('dragstop',function( e,ui){ 
        var xPos = ui.position.left; 
        var yPos = ui.position.top;
        var color = $(this).find('.note_content textarea').attr('data_color')
        var note = $(this).find('.note_content textarea').val();
        var attr = JSON.parse($(this).find('.note_box').attr('text_data'))
                    
        if(attr.id != 0){
            let data = attr
            data.note = note
            data.xPos = xPos+'px'
            data.yPos = yPos+'px'
            data.color = color
            $(this).find('.note_box').attr('text_data', JSON.stringify(data))
        }else{ 
            var data = JSON.stringify({id : 0, note:note, xPos : xPos+'px', yPos : yPos+'px', color : color})
            $(this).find('.note_box').attr('text_data', data)
        }
        $('.draggableDiv').css('z-index','0');
		$(this).zIndex(1);
    });

 	$('.delete_note').click(deleteNote);
	$('textarea').autogrow();
	
    $('.draggableDiv');
	return false; 
};



$(document).ready(function() {
    
    $(".content_inner .container-fluid .row").height($(document).height());
    
    $(".add_note_box").click(function(){
        newNote();
    });

    $('.delete_note').click();
	  
    return false;
});

function randomNumber(min, max) {  
    min = Math.ceil(min); 
    max = Math.floor(max); 
    return Math.floor(Math.random() * (max - min + 1)) + min; 
}