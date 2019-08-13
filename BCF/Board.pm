use strict;
use warnings;

package BCF::Board;
use autodie;
use BCF::Config;

sub new {
    my ($class, $board) = @_;
    my $self = ( $board )? $board : {};
    bless $self, $class;
    $self->init unless $board;
    return $self;
}

sub init {
    my $self = shift;
    for my $i ( 1 .. NL ) {
        for my $j ( 1 .. NL ) {
            $self->{_}{$i}{$j} = EMPTY;
        }
    }
    $self->{turn} = BLACK;
    $self->{last} = WHITE;
    $self->{scoreB} = 0;
    $self->{scoreW} = 0;
    $self->{X} = -1;
    $self->{Y} = -1;
    $self->{moves} = 0;
    $self->{bcf} = 1;
}

sub get_stone {
    my ($self, $x, $y) = @_;
    return $self->{_}{$x}{$y};
}

sub set_stone {
    my ($self, $x, $y, $stone) = @_;
    $self->{_}{$x}{$y} = $stone;
}

sub get_score {
    my ($self, $stone) = @_;
    if ( $stone eq BLACK ) {
        return $self->{scoreB};
    } else {
        return $self->{scoreW};
    }
}

sub set_score {
    my ($self, $stone, $score) = @_;
    if ( $stone eq BLACK ) {
        $self->{scoreB} = $score;
    } else {
        $self->{scoreW} = $score;
    }
}

sub is_last_move {
    my ($self, $x, $y) = @_;
    return ($self->{X} == $x) && ($self->{Y} == $y);
}

sub get_last_move {
    my $self = shift;
    return ($self->{X}, $self->{Y});

}

sub set_last_move {
    my ($self, $x, $y) = @_;
    $self->{X} = $x;
    $self->{Y} = $y;
}

sub toggle_turn {
    my $self = shift;
    $self->{last} = $self->{turn};
    $self->{turn} = ( $self->{last} eq BLACK )? WHITE : BLACK;
}

sub whose_turn {
    my $self = shift;
    return $self->{turn};
}

sub last_turn {
    my $self = shift;
    return $self->{last};
}

sub is_inside {
    my ($self, $x, $y) = @_;
    return 0 if $x < 1 || $x > NL;
    return 0 if $y < 1 || $y > NL;
    return 1;
}

sub is_invalid_move {
    my ($self, $x, $y) = @_;
    return 1 if $self->get_stone($x, $y);
    return 2 if $self->check_3_3($x, $y);
    return 0;
}

sub make_move {
    my ($self, $x, $y) = @_;
    return 0 if $self->is_invalid_move($x, $y);
    $self->{moves}++;
    $self->set_stone($x, $y, $self->{turn});
    $self->set_last_move($x, $y);
    $self->bite_move($x, $y) if $self->{bcf};
    $self->toggle_turn;
    return 1;
}

sub check_quit {
    my ($self, $x, $y) = @_;
    return 1 if $self->{scoreB} >= VP or $self->{scoreW} >= VP;
    return 1 if ( 1 + $self->check_quit_along($x, $y, -1,  0) 
                    + $self->check_quit_along($x, $y,  1,  0) ) == GOAL;
    return 1 if ( 1 + $self->check_quit_along($x, $y,  0, -1) 
                    + $self->check_quit_along($x, $y,  0,  1) ) == GOAL;
    return 1 if ( 1 + $self->check_quit_along($x, $y, -1, -1) 
                    + $self->check_quit_along($x, $y,  1,  1) ) == GOAL;
    return 1 if ( 1 + $self->check_quit_along($x, $y, -1,  1) 
                    + $self->check_quit_along($x, $y,  1, -1) ) == GOAL;
    return 0;
}

sub check_quit_along {
    my ($self, $x, $y, $dx, $dy) = @_;
    my $num  = 0;
    while ( 1 ) {
        $x += $dx;
        $y += $dy;
        return $num unless $self->is_inside($x, $y);
        return $num if $self->get_stone($x, $y) ne $self->last_turn;
        $num++;
    }
}

sub check_3_3 {
    my ($self, $x, $y) = @_;
    my $count = 0;
    $count++ if ( 1 + $self->check_3_3_along($x, $y, -1,  0) 
                    + $self->check_3_3_along($x, $y,  1,  0) ) == 3;
    $count++ if ( 1 + $self->check_3_3_along($x, $y,  0, -1) 
                    + $self->check_3_3_along($x, $y,  0,  1) ) == 3;
    $count++ if ( 1 + $self->check_3_3_along($x, $y, -1, -1) 
                    + $self->check_3_3_along($x, $y,  1,  1) ) == 3;
    return 0 unless $count;
    $count++ if ( 1 + $self->check_3_3_along($x, $y, -1,  1) 
                    + $self->check_3_3_along($x, $y,  1, -1) ) == 3;
    if ( $count >= 2 ) {
        return 1;
    } else {
        return 0;
    }
}

sub check_3_3_along {
    my ($self, $x, $y, $dx, $dy) = @_;
    my $num = 0;
    while ( 1 ) {
        $x += $dx;
        $y += $dy;
        return -NL unless $self->is_inside($x, $y);
        return $num if $self->get_stone($x, $y) eq EMPTY;
        return -NL if $self->get_stone($x, $y) ne $self->whose_turn;
        $num++;
    }
}

sub bite_move {
    my ($self, $x, $y) = @_;
    $self->bite_move_along($x, $y, -1,  0);
    $self->bite_move_along($x, $y,  1,  0);
    $self->bite_move_along($x, $y,  0, -1);
    $self->bite_move_along($x, $y,  0,  1);
    $self->bite_move_along($x, $y,  1,  1);
    $self->bite_move_along($x, $y, -1,  1);
    $self->bite_move_along($x, $y,  1, -1);
    $self->bite_move_along($x, $y, -1, -1);
}

sub bite_move_along {
    my ($self, $x, $y, $dx, $dy) = @_;
    return unless $self->is_inside($x + 3*$dx, $y + 3*$dy);
    if ( $self->get_stone($x + 3*$dx, $y + 3*$dy) eq $self->whose_turn and 
         $self->get_stone($x + 2*$dx, $y + 2*$dy) eq $self->last_turn and 
         $self->get_stone($x + 1*$dx, $y + 1*$dy) eq $self->last_turn ) {

        $self->set_stone($x + 2*$dx, $y + 2*$dy, EMPTY);
        $self->set_stone($x + 1*$dx, $y + 1*$dy, EMPTY);
        if ( $self->whose_turn eq BLACK ) {
            $self->{scoreB} += 2;
        } else  {
            $self->{scoreW} += 2;
        }
    }
}

1;
