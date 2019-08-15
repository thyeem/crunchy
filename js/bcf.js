$(document).ready(function() {
    NL = $('#NL').val();
    SOFIAI = $('#SOFIAI').val();
    MARIAI = $('#MARIAI').val();
    HUMAN  = $('#HUMAN').val();
    BLACK  = $('#BLACK').val();
    WHITE  = $('#WHITE').val();
    EMPTY  = $('#EMPTY').val();
    UNIT   = $('#UNIT').val();
    _view = $('#view').val();
    _view = (_view) ? _view.split(':') : _view;
    _id = $('#id').val();
    _bcf = +$('#bcf').val();
    _sec = +$('#sec').val();
    _locked = +$('#locked').val();
    _pB = $('#pBset').val();
    _pW = $('#pWset').val();
    _eB = $('#eB').val();
    _eW = $('#eW').val();
    _x = +$('#x').val();
    _y = +$('#y').val();
    _moves = +$('#moves').val();
    _turn = $('#turn').val();
    _rpOn = +$('#rpOn').val();
    _alert = $('#alert').val();
    _bell_on = (_rpOn) ? 0 : 1;
    _flash = null;
    _counter = null;
    _xhr = null;
    _ai = 0;

    render_header();
    render_EWP();
    render_board();

    // render board and stones
    function render_board() {
        _board = new Image();
        _black = new Image();
        _white = new Image();
        _dot = new Image();
        _board.src = "img/board.png";
        _black.src = "img/30px/black.png";
        _white.src = "img/30px/white.png";
        _dot.src = "img/30px/dot.png";
        _board.onload = () => {
            _context = document.getElementById('board').getContext('2d');
            _context.drawImage(_board, 0, 0, 570, 570);
            if (!_view) return;
            for (var n = 0; n < NL*NL; n++) { 
                if (_y < 0 || _x < 0) break;
                if (_view[n] === EMPTY) continue;
                var i = parseInt(n / NL);
                var j = n % NL;
                var color = _view[n] === BLACK ? _black : _white;
                _context.drawImage(color, i*UNIT, j*UNIT, UNIT, UNIT);
            }
            _context.drawImage(_dot, (_x-1)*UNIT, (_y-1)*UNIT, UNIT, UNIT);
        }
    }

    function render_header() {
        $('#pB').val(_pB);
        $('#pW').val(_pW);
        $('#bcf_switch').removeClass();
        $('#bell').removeClass();
        (_bcf)? $('#bcf_switch').addClass('fa fa-toggle-on') :
                $('#bcf_switch').addClass('fa fa-toggle-off');

        (_bell_on)? $('#bell').addClass('fa fa-bell') :
                    $('#bell').addClass('fa fa-bell-slash');
    }

    function render_EWP() {
        $('#eB').val(_eB);
        $('#eW').val(_eW);
        $('#black-wp').attr('style', 'width:'+_eB+'%');
        $('#white-wp').attr('style', 'width:'+_eW+'%');
        _eB = (+_eB > 7) ? _eB+'%' : '';
        _eW = (+_eW > 7) ? _eW+'%' : '';
        $('#black-wp').text(_eB);
        $('#white-wp').text(_eW);    
    }

    function overlapped(x, y) {
        if (_view[NL * (x-1) + (y-1)] === EMPTY) return false;
        else return true;
    }

    // counter
    function clock_timer() {
        if (_locked || !_bell_on) return false;
        if (_sec > 0 ) $('#counter').html(--_sec);
        flash_screen();

        // when time's up
        if (_sec <= 0) {
            var whowon = (_turn === BLACK) ? "White" : "Black";
            alert('Oops! Time\'s up. ' + whowon + ' won.');
            clearInterval(_flash);
            clearInterval(_counter);
            _locked = 1;
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
        if (_counter) clearInterval(_counter);
        if (_flash) clearInterval(_flash);
    }

    function goto_move(n) {
        if (! _rpOn) return;
        $('#do').val('replay');
        $('#go').val((n < 0)? 0 : n);
        $('#form').trigger('submit');
        return false;
    }

    // manual submit redefined
    $('#form').submit(function(e) {
        e.preventDefault();
        var form = $('#form');
        $.ajax({
            type: form.attr('method'),
            url: form.attr('action'),
            data: form.serialize(),
            dataType: 'html',
        })
        .done(function(data) {
            //var e = $(data).filter('#body').html();
            //var body = /<body.*>([\s\S]+)<\/body>/.exec(data);
            //alert(body[0]);
            //$("body").html(body[0]);
            //document.body.innerHTML = body[0];
            $('header').remove();
            $('body').html(data);
            return false;
        })
        return false;
    });

    // TODO: when page is changed, call _xhr.abort()
    // ajax calling for AI
    function ajax_let_AIs_play() {
        if (_locked) return false;
        var agent = (_turn === BLACK) ? _pB : _pW;
        $.ajax({
            type: 'post',
            url: 'ajax_api.pl',
            timeout: 70000,
            data: {'id': _id, 'bcf': _bcf, 'turn': _turn, 'agent': agent},
        })
        .fail(function(req, status, msg) {
            //alert(req.responseText + '\n' + msg);
            return false;
        })
        .always(function(res) {
            $('#x').val(res['x']);
            $('#y').val(res['y']);
            if (res['eB']) $('#eB').val(res['eB']);
            if (res['eW']) $('#eW').val(res['eW']);
            do_before_submit();
            $('#form').trigger('submit');
            return false;
        });
    }

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

    // submit event handler --------------------------------------
    // clicking board
    $('#board').click(function(e) {  
        if (_locked || _ai) return false;
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();
        var x = Math.ceil( (e.clientX - offset_l) / UNIT );
        var y = Math.ceil( (e.clientY - offset_t) / UNIT );
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
        return false;
    });
    
    // toggle save input 
    $('#save').click(function() {
        $('#msg_div').fadeToggle(300);
    });

    $('#msg').keydown(function(e) {
        if (e.which === 13) {
            $('#do').val('save');
            do_before_submit();
            $('#form').trigger('submit');
            return false;
        }
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
        return false;
    });
    
    // submit nav-back
    $('#back').one('click', function() {
        goto_move(_moves-1);
        return false;
    });
    
    // submit nav-forth 
    $('#forth').one('click', function() {
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
    $('body').one('keydown', function(e) {
        if (e.which === 37) {
            goto_move(_moves-1)
            return false;
        } else if (e.which === 39) {
            goto_move(_moves+1)
            return false;
        } else if (e.which === 38) {
            goto_move(_moves-5)
            return false;
        } else if (e.which === 40) {
            goto_move(_moves+5)
            return false;
        }
    });

    //------------------------------------------------------
    if (! _locked) {
        _counter = setInterval(clock_timer, 1000);
        // trigger AI agents if needed
        (_turn === BLACK) ? $('#pB').trigger('change')
                          : $('#pW').trigger('change');
    } else {
        $('#bell').removeClass();
        $('#bell').addClass('fa fa-bell-slash');
        _bell_on = false;
    }
}); // end of ready

