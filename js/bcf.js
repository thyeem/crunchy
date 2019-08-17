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
    $help = $('#help');
    $title = $('#title');
    $spinner = $('#spinner');

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
    _alert = $alert.val();
    _bellOn = (_locked) ? 0 : 1;
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
        $spinner.hide();
        $pB.val(_pB);
        $pW.val(_pW);
        (_bcf)? toggle_bcf(1) : toggle_bcf(0);
        (_bellOn)? toggle_bell(1) : toggle_bell(0); 
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

    // clock-timer
    function set_timer() {
        if (_locked || !_bellOn) return false;
        _counter = setInterval(update_counter, 1000);
    }

    function update_counter() {
        if (_locked || !_bellOn) return false;
        if (_sec > 0 ) $counter.html(--_sec);
        flash_screen();

        // when time's up
        if (_sec <= 0) {
            var whowon = (_turn === BLACK) ? "White" : "Black";
            alert('Oops! Time\'s up. ' + whowon + ' won.');
            if (_counter) clearInterval(_counter);
            if (_flash) clearInterval(_flash);
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

    function toggle_bell(m) {
        if (m === undefined) {
            _bellOn = (_bellOn)? 0 : 1;
            $bell.toggleClass("fa-bell");
            $bell.toggleClass("fa-bell-slash");
        } else if (m === 1) {
            _bellOn = 1;
            $bell.removeClass();
            $bell.addClass('fa fa-bell');
        } else {
            _bellOn = 0;
            $bell.removeClass();
            $bell.addClass('fa fa-bell-slash');
        }
    }

    function toggle_bcf(m) {
        if (m === undefined) {
            _bcf = _bcf ? 0 : 1;
            $bcf_switch.toggleClass("fa-toggle-on");
            $bcf_switch.toggleClass("fa-toggle-off");
        } else if (m === 1) {
            _bcf = 1;
            $bcf_switch.removeClass();
            $bcf_switch.addClass('fa fa-toggle-on');
        } else {
            _bcf = 0;
            $bcf_switch.removeClass();
            $bcf_switch.addClass('fa fa-toggle-off');
        }
    }

    function do_before_submit() {
        $bcf.val(_bcf);
        if (_counter) clearInterval(_counter);
        if (_flash) clearInterval(_flash);
    }

    function goto_move(n) {
        if (!_locked) return false;
        $do.val('replay');
        $go.val((n < 0)? 0 : n);
        $form.trigger('submit');
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
            var d = document.open("text/html", "replace");
            d.write(data);
            d.close();
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
            timeout: 40000,
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
            $spinner.fadeOut();
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
        if (_xhr) _xhr.abort();
        if (_locked) return false;
        _pB = $pB.val();
        if (_turn === BLACK && _pB !== HUMAN) _pBai = 1;
        if (_pBai) {
            ajax_let_AIs_play();
            $(this).off('click');
            $spinner.fadeIn();
        }
        return false;
    });

    $pW.change(function() {
        if (_xhr) _xhr.abort();
        if (_locked) return false;
        if (_pWai) return false; 
        _pW = $pW.val();
        if (_turn === WHITE && _pW !== HUMAN) _pWai = 1;
        if (_pWai) { 
            ajax_let_AIs_play();
            $(this).off('click');
            $spinner.fadeIn();
        }
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
        toggle_bcf();
        return false;
    });
    
    // toggle save input 
    $save.click(function() {
        $msg_div.fadeIn();
        $msg.focus();
        toggle_bell(0);
        return false;
    });

    $msg.on('mouseout', function() {
        $msg_div.hide();
        return false;
    }).focusout(function() {
        $msg_div.hide();
        return false;
    });

    $msg.keydown(function(e) {
        if (e.which === 13) {
            $do.val('save');
            $float_div.hide();
            $key_div.show();
            $pwd.focus();
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
        $rp_list.fadeToggle();
        toggle_bell(0);
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
        $pwd.focus();
    });

    // HELP
    $title.click(function() {
        $help.fadeToggle();
        toggle_bell(0);
        return false;
    });
    
    $help.on('mouseout', function() {
        $help.hide();
        return false;
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
        toggle_bell();
        return false;
    });
    
    // submit nav-back
    $back.click(function() {
        if (!_locked) return false;
        goto_move(_moves-1);
        return false;
    });
    
    // submit nav-forth 
    $forth.click(function() {
        if (!_locked) return false;
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
            goto_move(_moves-1);
        } else if (e.which === 39) {
            goto_move(_moves+1);
        } else if (e.which === 38) {
            goto_move(_moves-5);
        } else if (e.which === 40) {
            goto_move(_moves+5);
        } else if (e.which === 48) {
            goto_move(0);
        } else if (e.which === 57) {
            goto_move(361);
        } else if (e.which === 77) {
            toggle_bell(0);
        }
    });
    
    // run-run-run -----------------------------------------
    set_timer();
    render_header();
    render_EWP();
    render_board();

    // trigger AI agents if needed
    (_turn === BLACK) ? $pB.trigger('change')
                      : $pW.trigger('change');

}); // end of ready

