use strict;
use warnings;
use Data::Dumper;

package BCF::Web;
use BCF::Config;
use BCF::Game;
use CGI;
use CGI::Carp qw/ fatalsToBrowser /;
use Digest::SHA qw/ sha256_hex /;
use Template;

sub new {
    my ($class, $cgi) = @_;
    my $self = BCF::Config->new;
    bless $self, $class;
    $self->{cgi} = $cgi;
    $self->init;
    return $self;
}

sub init {
    my $self = shift;
    $self->{do}  = $self->{cgi}->param('do');
    $self->{id}  = $self->{cgi}->param('id');
    $self->{go}  = $self->{cgi}->param('go');
    $self->{pB}  = $self->{cgi}->param('pB') || HUMAN;
    $self->{pW}  = $self->{cgi}->param('pW') || HUMAN;
    $self->{x}   = $self->{cgi}->param('x');
    $self->{y}   = $self->{cgi}->param('y');
    $self->{bcf} = $self->{cgi}->param('bcf');
    $self->{eB}  = $self->{cgi}->param('eB');
    $self->{eW}  = $self->{cgi}->param('eW');
    $self->{msg} = $self->{cgi}->param('msg');
    $self->{pwd} = $self->{cgi}->param('pwd');
    $self->{did} = $self->{cgi}->param('did');

    my $id = ( $self->{id} ) ? $self->{id} : undef;
    if ( $self->{do} && $self->{do} eq 'replay' ) {
        $self->{game} = ( -e "sav/$id" ) ? BCF::Game->new($id, 1)
                                         : BCF::Game->new($id);
    } else {
        $self->{game} = BCF::Game->new($id);
    }
    $self->{bcf} = ( $id && !$self->{bcf} )? 0 : 1;
    $self->{game}->set_bcf_mode($self->{bcf});
    $self->{id} = $self->{game}{id};
}

sub dump_template {
    my $self = shift;
    my $t = Template->new();
    print $self->{cgi}->header( -charset => 'UTF-8' );
    $t->process($self->{template}, $self);
}

sub process {
    my $self = shift;
    if ( ! $self->{do} ) {
        $self->do_keep_playing;
    } elsif ( $self->{do} eq 'undo' ) {
        $self->do_undo;
    } elsif ( $self->{do} eq 'save' ) {
        $self->do_save;
    } elsif ( $self->{do} eq 'replay' ) {
        $self->do_replay;
    } elsif ( $self->{do} eq 'delete' ) {
        $self->do_delete;
    }

    $self->{pB} = $self->{game}{pB};
    $self->{pW} = $self->{game}{pW};
    $self->{eB} = $self->{game}{eB};
    $self->{eW} = $self->{game}{eW};
    $self->{view} = $self->{game}->ravel_board;
    $self->{board} = $self->{game}{board};
    $self->{gamelist} = $self->{game}->load_gamelist;
    $self->{game}->save_game;
}

sub do_keep_playing {
    my $self = shift;
    my ($x, $y) = ($self->{x}, $self->{y});
    return unless ( $x && $y );
    if ( $self->{game}{board}->is_invalid_move($x, $y) == 2 ) {
        $self->{alert} = '3-3 connection is not allowed.';
        $self->{violation} = 1;
        return;
    }
    $self->{game}->set_player($self->{pB}, $self->{pW});
    $self->{game}->set_EWP($self->{eB}, $self->{eW});
    $self->{game}->make_move($x, $y);
    my $winner = $self->{game}->who_won;
    return unless $winner;
    $self->{alert} = 'Black won.' if $winner eq BLACK;
    $self->{alert} = 'White won.' if $winner eq WHITE;
    $self->{locked} = 1 if $winner;
}

sub do_undo {
    my $self = shift;
    $self->{game}->undo_move;
    $self->{game}->set_player(HUMAN, HUMAN);
}

sub do_save {
    my $self = shift;
    $self->{msg} =~ s/^\s+|\s+$//g;
    return unless $self->{msg};
    unless ( $self->validate_passwd($self->{pwd}) ) {
        $self->{alert} .= 'Failed to save. Incorrect secret key!';
        return;
    }
    $self->{game}->save_game_to_gamelist($self->{id}, $self->{msg}, sha256_hex($self->{pwd}));
    $self->{locked} = 1;
}

sub do_replay {
    my $self = shift;
    $self->{locked} = 1;
    return unless defined $self->{go};
    $self->{game}->goto_move($self->{go}, $self->{bcf});
}

sub do_delete {
    my $self = shift;
    $self->{locked} = 1;
    unless ( $self->validate_passwd($self->{pwd}) ) {
        $self->{alert} = 'Failed to delete. Incorrect secret key!';
        return;
    }
    return unless defined $self->{did};
    my $saved_by = ( $self->is_____($self->{pwd}) )        ? 'master' :
                   ( $self->is_the_invited($self->{pwd}) ) ? sha256_hex($self->{pwd}) : undef;
    return unless defined $saved_by;
    $self->{game}->delete_game_from_gamelist($self->{did}, $saved_by);

}

sub validate_passwd {
    my ($self, $pwd) = @_;
    return 1 if $self->is_____($pwd);
    return $self->is_the_invited($pwd);
}

sub is_____ {
    my ($self, $pwd) = @_;
    my $hashed = sha256_hex $pwd;
    return grep /^$hashed$/, @{ $self->{____} };
}

sub is_the_invited {
    my ($self, $pwd) = @_;
    my $hashed = sha256_hex $pwd;
    return grep /^$hashed$/, @{ $self->{keys} };
}


1;
