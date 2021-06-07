$(document).ready(function() {
    // caching jQuery obj ----------------------------------
    $NL            = $('#NL');
    $SOFIAI        = $('#SOFIAI');
    $MARIAI        = $('#MARIAI');
    $HUMAN         = $('#HUMAN');
    $BLACK         = $('#BLACK');
    $WHITE         = $('#WHITE');
    $EMPTY         = $('#EMPTY');
    $UNIT          = $('#UNIT');
    $body          = $('body');
    $view          = $('#view');
    $bcf           = $('#bcf');
    $locked        = $('#locked');
    $id            = $('#id');
    $pB            = $('input[type=radio][name=pB]');
    $pW            = $('input[type=radio][name=pW]');
    $eB            = $('#eB');
    $eW            = $('#eW');
    $pBset         = $('#pBset');
    $pWset         = $('#pWset');
    $x             = $('#x');
    $y             = $('#y');
    $moves         = $('#moves');
    $turn          = $('#turn');
    $bcf_switch    = $('#bcf-switch');
    $bcf_mode      = $('#bcf-mode');
    $lock_status   = $('#game-status-lock');
    $save          = $('#save');
    $black_wp      = $('#black-wp');
    $white_wp      = $('#white-wp');
    $do            = $('#do');
    $go            = $('#go');
    $form          = $('#form');
    $board         = $('#board');
    $float_div     = $('.float-div');
    $msg_div       = $('#msg-div');
    $key_div       = $('#key-div');
    $rp_list       = $('#rp-list');
    $pwd           = $('#pwd');
    $msg           = $('#msg');
    $did           = $('#did');
    $undo          = $('#undo');
    $replay        = $('#replay');
    $spinner       = $('#spinner');

    // define-init global var ------------------------------
    NL = $NL.val();
    SOFIAI      = $SOFIAI.val();
    MARIAI      = $MARIAI.val();
    HUMAN       = $HUMAN.val();
    BLACK       = $BLACK.val();
    WHITE       = $WHITE.val();
    EMPTY       = $EMPTY.val();
    UNIT        = $UNIT.val();
    _view       = $view.val();
    _view       = (_view) ? _view.split(':') : _view;
    _id         = $id.val();
    _bcf        = +$bcf.val();
    _locked     = +$locked.val();
    _pB         = $pBset.val();
    _pW         = $pWset.val();
    _eB         = $eB.val();
    _eW         = $eW.val();
    _x          = +$x.val();
    _y          = +$y.val();
    _moves      = +$moves.val();
    _turn       = $turn.val();
    _xhr        = null;
    _blackAI    = 0;
    _whiteAI    = 0;

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
        (_bcf)? toggle_bcf(1) : toggle_bcf(0);
        lock_status(_locked);
    }

    function render_players() {
        $pB.filter('[value=' + _pB + ']').prop("checked",true);
        $pW.filter('[value=' + _pW + ']').prop("checked",true);

        // trigger AI agents if needed
        (_turn === BLACK) ? $pB.filter(':checked').trigger('change')
                          : $pW.filter(':checked').trigger('change');
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

    function lock_status(status) {
        if (status) {
            $lock_status.removeClass();
            $lock_status.addClass('fa fa-lock');

        } else {
            $lock_status.removeClass();
            $lock_status.addClass('fa fa-unlock');
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

    function do_submit() {
        $bcf.val(_bcf);
        $form.trigger('submit');
        return false;
    }

    function goto_move(n) {
        if (!_locked) return false;
        $do.val('replay');
        $go.val((n < 0)? 0 : n);
        do_submit();
    }


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
            $spinner.fadeOut();
            do_submit();
            return false;
        });
    }


    // onchange: letting AIs play ---------------------------
    $pB.change(function() {
        if (_xhr) _xhr.abort();
        if (_locked) return false;
        _pB = $pB.filter(':checked').val();
        if (_turn === BLACK && _pB !== HUMAN) _blackAI = 1;
        if (_blackAI) {
            ajax_let_AIs_play();
            $(this).off('click');
            $spinner.fadeIn();
        }
        return false;
    });

    $pW.change(function() {
        if (_xhr) _xhr.abort();
        if (_locked) return false;
        if (_whiteAI) return false;
        _pW = $pW.filter(':checked').val();
        if (_turn === WHITE && _pW !== HUMAN) _whiteAI = 1;
        if (_whiteAI) {
            ajax_let_AIs_play();
            $(this).off('click');
            $spinner.fadeIn();
        }
        return false;
    });

    // when clicking the board -----------------------------------
    $board.click(function(e) {
        if (_blackAI || _whiteAI) return false;
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();
        var x = Math.ceil( (e.clientX - offset_l) / UNIT );
        var y = Math.ceil( (e.clientY - offset_t) / UNIT );

        if (_locked) {
            // L/R back and forth navigator
            if (x < 4 && y < 4) {
                goto_move(0);
                return false;
            }
            if (x > 15 && y > 15) {
                goto_move(361);
                return false;
            }
            if (x < 10 && y < 4) {
                goto_move(_moves-5);
                return false;
            }
            if (x > 10 && y > 15) {
                goto_move(_moves+5);
                return false;
            }
            (x < 10) ? goto_move(_moves-1)
                     : goto_move(_moves+1);
        } else {
            // In playing mode
            if (overlapped(x, y)) return false;
            $x.val(x);
            $y.val(y);
            do_submit();
        }
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
            $pwd.val(sha256($pwd.val()));
            do_submit();
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
        return false;
    });

    // submit undo
    $undo.click(function() {
        if (_blackAI || _whiteAI) return false;
        $do.val('undo');
        $go.val(_moves-1);
        do_submit();
        return false;
    });


    //------------------------------------------
    // shortcuts
    $body.on('keydown', function(e) {
        if (_locked && e.ctrlKey && e.which === 37) {
            e.preventDefault();
            goto_move(_moves-1);
        } else if (_locked && e.ctrlKey && e.which === 39) {
            e.preventDefault();
            goto_move(_moves+1);
        } else if (_locked && e.ctrlKey && e.which === 38) {
            e.preventDefault();
            goto_move(_moves-5);
        } else if (_locked && e.ctrlKey && e.which === 40) {
            e.preventDefault();
            goto_move(_moves+5);
        } else if (_locked && e.ctrlKey && e.which === 48) {
            e.preventDefault();
            goto_move(0);
        } else if (_locked && e.ctrlKey && e.which === 57) {
            e.preventDefault();
            goto_move(361);
        } else if (e.ctrlKey && e.which === 78) {
            document.getElementById('new-game').click();
        } else if (e.ctrlKey && e.which === 84) {
            document.getElementById('bcf-mode').click();
        } else if (e.ctrlKey && e.which === 90) {
            document.getElementById('undo').click();
        } else if (e.ctrlKey && e.which === 76) {
            document.getElementById('replay').click();
        } else if (e.ctrlKey && e.which === 83) {
            document.getElementById('save').click();
        } else if (e.ctrlKey && e.which === 49) {
            document.getElementById('b-human').click();
        } else if (e.ctrlKey && e.which === 50) {
            document.getElementById('b-sofia').click();
        } else if (e.ctrlKey && e.which === 51) {
            document.getElementById('b-maria').click();
        } else if (e.ctrlKey && e.which === 52) {
            document.getElementById('w-human').click();
        } else if (e.ctrlKey && e.which === 53) {
            document.getElementById('w-sofia').click();
        } else if (e.ctrlKey && e.which === 54) {
            document.getElementById('w-maria').click();
        }
    });


    // run together at once --------------------------------
    render_board();
    render_header();
    render_players();
    render_EWP();

}); // end of ready

