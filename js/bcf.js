$(document).ready(function() {
    // caching jQuery obj ----------------------------------
    $NL = $('#NL');
    $SOFIAI = $('#SOFIAI');
    $MARIAI = $('#MARIAI');
    $HUMAN  = $('#HUMAN');
    $BLACK  = $('#BLACK');
    $WHITE  = $('#WHITE');
    $EMPTY  = $('#EMPTY');
    $UNIT   = $('#UNIT');
    $body = $('body');
    $view = $('#view');
    $bcf = $('#bcf');
    $sec = $('#sec');
    $locked = $('#locked');
    $id = $('#id');
    $pB = $('#pB');
    $pW = $('#pW');
    $eB = $('#eB');
    $eW = $('#eW');
    $pBset = $('#pBset');
    $pWset = $('#pWset');
    $x = $('#x');
    $y = $('#y');
    $moves = $('#moves');
    $turn = $('#turn');
    $rpOn = $('#rpOn');
    $alert = $('#alert');
    $bell = $('#bell');
    $bell_switch = $('#bell-switch');
    $bcf_switch = $('#bcf-switch');
    $bcf_mode = $('#bcf-mode');
    $save = $('#save');
    $black_wp = $('#black-wp');
    $white_wp = $('#white-wp');
    $counter = $('#counter');
    $do = $('#do');
    $go = $('#go');
    $form = $('#form');
    $board = $('#board');
    $timer = $('#timer');
    $float_div = $('.float-div');
    $msg_div = $('#msg-div');
    $key_div = $('#key-div');
    $rp_list = $('#rp-list');
    $pwd = $('#pwd');
    $msg = $('#msg');
    $did = $('#did');
    $back = $('#back');
    $forth = $('#forth');
    $undo = $('#undo');
    $replay = $('#replay');

    // define-init global var ------------------------------
    NL = $NL.val();
    SOFIAI = $SOFIAI.val();
    MARIAI = $MARIAI.val();
    HUMAN  = $HUMAN.val();
    BLACK  = $BLACK.val();
    WHITE  = $WHITE.val();
    EMPTY  = $EMPTY.val();
    UNIT   = $UNIT.val();
    _view = $view.val();
    _view = (_view) ? _view.split(':') : _view;
    _id = $id.val();
    _bcf = +$bcf.val();
    _sec = +$sec.val();
    _locked = +$locked.val();
    _pB = $pBset.val();
    _pW = $pWset.val();
    _eB = $eB.val();
    _eW = $eW.val();
    _x = +$x.val();
    _y = +$y.val();
    _moves = +$moves.val();
    _turn = $turn.val();
    _rpOn = +$rpOn.val();
    _alert = $alert.val();
    _bellOn = (_locked ||_rpOn) ? 0 : 1;
    _flash = null;
    _counter = null;
    _xhr = null;
    _pBai = 0;
    _pWai = 0;

    //------------------------------------------------------
    // render board and stones
    function render_board() {
        _board = new Image();
        _black = new Image();
        _white = new Image();
        _dot = new Image();
        _board.onload = () => {
            _context = $board[0].getContext('2d');
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
        _board.src = "img/board.png";
        _black.src = "img/30px/black.png";
        _white.src = "img/30px/white.png";
        _dot.src = "img/30px/dot.png";
    }

    function render_header() {
        $pB.val(_pB);
        $pW.val(_pW);
        $bcf_switch.removeClass();
        $bell.removeClass();
        (_bcf)? $bcf_switch.addClass('fa fa-toggle-on') :
                $bcf_switch.addClass('fa fa-toggle-off');

        (_bellOn)? $bell.addClass('fa fa-bell') :
                   $bell.addClass('fa fa-bell-slash');
    }

    function render_EWP() {
        $eB.val(_eB);
        $eW.val(_eW);
        $black_wp.attr('style', 'width:'+_eB+'%');
        $white_wp.attr('style', 'width:'+_eW+'%');
        _eB = (+_eB > 7) ? _eB+'%' : '';
        _eW = (+_eW > 7) ? _eW+'%' : '';
        $black_wp.text(_eB);
        $white_wp.text(_eW);    
    }

    function overlapped(x, y) {
        if (_view[NL * (x-1) + (y-1)] === EMPTY) return false;
        else return true;
    }

    // counter
    function clock_timer() {
        if (_locked || !_bellOn) return false;
        if (_sec > 0 ) $counter.html(--_sec);
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
                $body.toggleClass('flash')
            }, 400);
        }
    }

    function do_before_submit() {
        $bcf.val(_bcf);
        if (_counter) clearInterval(_counter);
        if (_flash) clearInterval(_flash);
    }

    function goto_move(n) {
        if (! _rpOn) return;
        $do.val('replay');
        $go.val((n < 0)? 0 : n);
        $form.trigger('submit');
        return false;
    }

    // manual submit redefined
    $form.submit(function(e) {
        e.preventDefault();
        $.ajax({
            type: $form.attr('method'),
            url: $form.attr('action'),
            data: $form.serialize(),
            dataType: 'html',
        })
        .done(function(data) {
            $('header').remove();
            $body.html(data);
            return false;
        })
        return false;
    });

    // ajax calling for AI
    function ajax_let_AIs_play() {
        if (_locked) return false;
        var agent = (_turn === BLACK) ? _pB : _pW;
        _xhr = $.ajax({
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
            $x.val(res['x']);
            $y.val(res['y']);
            if (res['eB']) $eB.val(res['eB']);
            if (res['eW']) $eW.val(res['eW']);
            do_before_submit();
            $form.trigger('submit');
            return false;
        });
    }

    // blur when AIs on work
    $pB.on('mousedown', function(e) {
        if (!_pBai) return true;
        e.preventDefault();
        this.blur();
        window.focus();
    });

    $pW.on('mousedown', function(e) {
        if (!_pWai) return true;
        e.preventDefault();
        this.blur();
        window.focus();
    });

    // AI event handler --------------------------------------
    // onchange: let AIs go
    $pB.change(function() {
        if (_xhr !== null) _xhr.abort();
        if (_locked) return false;
        _pB = $pB.val();
        if (_turn === BLACK && _pB !== HUMAN) _pBai = 1;
        if (_pBai) ajax_let_AIs_play();
        if (_pBai) $(this).off('click');
        return false;
    });

    $pW.change(function() {
        if (_xhr !== null) _xhr.abort();
        if (_locked) return false;
        if (_pWai) return false; 
        _pW = $pW.val();
        if (_turn === WHITE && _pW !== HUMAN) _pWai = 1;
        if (_pWai) ajax_let_AIs_play();
        if (_pWai) $(this).off('click');
        return false;
    });

    // submit event handler --------------------------------------
    // clicking board
    $board.click(function(e) {  
        if (_locked || _pBai || _pWai) return false;
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();
        var x = Math.ceil( (e.clientX - offset_l) / UNIT );
        var y = Math.ceil( (e.clientY - offset_t) / UNIT );
        if (overlapped(x, y)) return false;
        $x.val(x);
        $y.val(y);
        do_before_submit();
        $form.trigger('submit');
        return false;
    });
    
    // bcf mode switch
    $bcf_mode.click(function() {
        $bcf_switch.toggleClass("fa-toggle-on");
        $bcf_switch.toggleClass("fa-toggle-off");
        _bcf = _bcf ? 0 : 1;
        return false;
    });
    
    // toggle save input 
    $save.click(function() {
        $msg_div.fadeToggle(300);
        return false;
    });

    $msg.on('mouseover', function() {
        $msg_div.show();
        return false;
    }).on('mouseout', function() {
        $msg_div.hide();
        return false;
    });

    $msg.keydown(function(e) {
        if (e.which === 13) {
            $do.val('save');
            $float_div.hide();
            $key_div.show();
            return false;
        }
    });
    
    // pwd submit
    $pwd.keydown(function(e) {
        if (e.which === 13) {
            $pwd.val(hex_sha1($pwd.val()));
            do_before_submit();
            $form.trigger('submit');
            return false;
        }
    });

    $key_div.on('mouseover', function() {
        $key_div.show();
        return false;
    }).on('mouseout', function() {
        $key_div.hide();
        return false;
    });
   
    // toggle replay list
    $replay.click(function() {
        $rp_list.fadeToggle(300);
        return false;
    });

    $rp_list.on('mouseover', function() {
        $rp_list.show();
        return false;
    }).on('mouseout', function() {
        $rp_list.hide();
        return false;
    });

    // toggle delete replay item 
    $('.rp-del').click(function() {
        $do.val('delete');
        $did.val($(this).attr('id'));
        $float_div.hide();
        $key_div.fadeToggle(300);
    });

    // submit undo 
    $undo.click(function() {
        if (_pBai || _pWai) return false;
        $do.val('undo');
        $go.val(_moves-1);
        do_before_submit();
        $form.trigger('submit');
        return false;
    });

    // counter switch
    $timer.click(function() {
        $bell.toggleClass("fa-bell");
        $bell.toggleClass("fa-bell-slash");
        _bellOn = (_bellOn)? 0 : 1;
        return false;
    });
    
    // submit nav-back
    $back.one('click', function() {
        goto_move(_moves-1);
        return false;
    });
    
    // submit nav-forth 
    $forth.one('click', function() {
        goto_move(_moves+1);
        return false;
    });

    //------------------------------------------
    // mouse middle button event: pause counter
    $(document).mousedown(function(e) {
        if (e.which === 2) {
            $timer.trigger('click'); 
        }
    });

    // left/right arrow key trigger
    $body.one('keydown', function(e) {
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
        } else if (e.which === 48) {
            goto_move(0)
            return false;
        } else if (e.which === 57) {
            goto_move(361)
            return false;
        } else if (e.which === 77) {
            $timer.trigger('click');
            return false;
        }
    });
    
    // run-run-run -----------------------------------------
    _counter = setInterval(clock_timer, 1000);
    render_header();
    render_EWP();
    render_board();

    // trigger AI agents if needed
    (_turn === BLACK) ? $pB.trigger('change')
                      : $pW.trigger('change');

}); // end of ready

