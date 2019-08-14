$(document).ready(function() {
    _counter = setInterval(clock_timer, 1000);
    _flash = null;
    _xhr = null;
    _ai = 0;

    $('#pB').val(_pB);
    $('#pW').val(_pW);
    $('#bcf_switch').removeClass();
    $('#bell').removeClass();

    (_bcf)? $('#bcf_switch').addClass('fa fa-toggle-on') :
            $('#bcf_switch').addClass('fa fa-toggle-off');

    (_bell_on)? $('#bell').addClass('fa fa-bell') :
                $('#bell').addClass('fa fa-bell-slash');

    // render board and stones
    _board = new Image();
    _black = new Image();
    _white = new Image();
    _dot = new Image();
    _board.onload = () => {
        render_board();
    }
    _board.src = "img/board.png";
    _black.src = "img/30px/black.png";
    _white.src = "img/30px/white.png";
    _dot.src = "img/30px/dot.png";

    function render_board() {
        _context = document.getElementById('board').getContext('2d');
        _context.drawImage(_board, 0, 0, 570, 570);
        for (var n = 0; n < NL*NL; n++) { 
            if (_lastY < 0 || _lastX < 0) break;
            if (_view[n] === EMPTY) continue;
            var i = parseInt(n / NL);
            var j = n % NL;
            var color = _view[n] === BLACK ? _black : _white;
            _context.drawImage(color, i*_unit, j*_unit, _unit, _unit);
        }
        _context.drawImage(_dot, (_lastX-1)*_unit, (_lastY-1)*_unit, _unit, _unit);
    }

    function overlapped(x, y) {
        if (_view[NL * (x-1) + (y-1)] === EMPTY) return false;
        else return true;
    }

    // counter
    function clock_timer() {
        if (_bell_on) {
            if (_sec > 0 ) $('#counter').html(--_sec);

            // lock when the game is closed
            if (_locked) {
                $('#bell').removeClass();
                $('#bell').addClass('fa fa-bell-slash');
                _bell_on = false;
            } else {
                flash_screen();
            }

            // when time's up
            if (_sec <= 0) {
                var whowon = (_turn === BLACK) ? "White" : "Black";
                alert('Oops! Time\'s up. ' + whowon + ' won.');
                clearInterval(_flash);
                clearInterval(_counter);
                _locked = 1;
            }
        }
        return false;
    }

    function flash_screen() {
        if (_sec === 10) {
            _flash = setInterval(function() {
                $('body').toggleClass('flash')
                $('#rp_id').toggleClass('flash')
            }, 400);
        }
    }

    function do_before_submit() {
        $('#bcf').val(_bcf);
        clearInterval(_counter);
        clearInterval(_flash);
    }

    function goto_move(n) {
        if (! _replay) return;
        $('#do').val('replay');
        $('#go').val((n < 0)? 0 : n);
        do_before_submit();
        $('#form').trigger('submit');
    }

    // TODO: when page is changed, call _xhr.abort()

    // AI event handler --------------------------------------
    // onchange: let AIs go
    $('#pB').change(function() {
        if (_locked) return false;
        _ai = 0;
        _pB = $('#pB').val();
        if (_turn === BLACK && _pB !== HUMAN) _ai = 1;
        if(_ai) ajax_let_AIs_play();
        return false;
    });

    $('#pW').change(function() {
        if (_locked) return false;
        _ai = 0;
        _pW = $('#pW').val();
        if (_turn === WHITE && _pW !== HUMAN) _ai = 1;
        if(_ai) ajax_let_AIs_play();
        return false;
    });

    // ajax calling for AI api
    function ajax_let_AIs_play() {
        if (_locked) return false;
        var agent = (_turn === BLACK) ? _pB : _pW;
        $.ajax({
            type: 'post',
            url: 'ajax_api.pl',
            timeout: 60000,
            data: {'id': _id, 'bcf': _bcf, 'turn': _turn, 'agent': agent},
        })
        .fail(function(req, status, msg) {
            //alert(req.responseText + '\n' + msg);
            return false;
        })
        .always(function(res) {
            $('#x').val(res['x']);
            $('#y').val(res['y']);
            do_before_submit();
            $('#form').trigger('submit');
        });
    }

    $('#form').submit(function(e) {
        e.preventDefault();
        var form = $(this);
        $.ajax({
            type: form.attr('method'),
            url: form.attr('action'),
            data: form.serialize(),
        })
        .done(function(html) {
            $('#wrapper').replaceWith(html);
        })
    });


    // submit event handler --------------------------------------
    // clicking board
    $('#board').click(function(e) {  
        if (_locked || _ai) return false;
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();
        var x = Math.ceil( (e.clientX - offset_l) / _unit );
        var y = Math.ceil( (e.clientY - offset_t) / _unit );
        if (overlapped(x, y)) return false;
        $('#x').val(x);
        $('#y').val(y);
        do_before_submit();
        $('#form').trigger('submit');
        return false;
    });
    
    // bcf mode switch
    $('#bcf_mode').click(function() {
        $('#bcf_switch').toggleClass("fa-toggle-on");
        $('#bcf_switch').toggleClass("fa-toggle-off");
        _bcf = _bcf ? 0 : 1;
    });
    
    // toggle save input 
    $('#save').click(function() {
        $('#msg_div').fadeToggle(300);
        $('#do').val('save');
        $('#bcf').val(_bcf);
    });
   
    // toggle replay list
    $('#replay').click(function() {
        $('#rp_list').fadeToggle(300);
    });

    // submit undo 
    $('#undo').click(function() {
        $('#do').val('undo');
        $('#go').val(_moves-1);
        do_before_submit();
        $('#form').trigger('submit');
        return false;
    });

    // counter switch
    $('#timer').click(function() {
        $('#bell').toggleClass("fa-bell");
        $('#bell').toggleClass("fa-bell-slash");
        _bell_on = (_bell_on)? 0 : 1;
    });
    
    // submit nav-back
    $('#back').click(function() {
        goto_move(_moves-1);
        return false;
    });
    
    // submit nav-forth 
    $('#forth').click(function() {
        goto_move(_moves+1);
        return false;
    });

    //------------------------------------------
    // mouse middle button event: pause counter
    $(document).mousedown(function(e) {
        if (e.which === 2) {
            $('#timer').trigger('click'); 
        }
    });

    // left/right arrow key trigger
    $('body').keydown(function(e) {
        if (e.which === 37) {
            goto_move(_moves-1)
        }
        if (e.which === 39) {
            goto_move(_moves+1)
        }
        if (e.which === 38) {
            goto_move(_moves-5)
        }
        if (e.which === 40) {
            goto_move(_moves+5)
        }
    });

    // trigger AI agents if needed
    (_turn === BLACK) ? $('#pB').trigger('change')
                      : $('#pW').trigger('change');


}); // end of ready

