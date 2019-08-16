use strict;
use warnings;
use Data::Dumper;

package BCF::Web;
use BCF::Config;
use BCF::Game;
use CGI;
use CGI::Carp qw/ fatalsToBrowser /;
use Digest::SHA qw/ sha1_hex /;
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
    $self->{id}  = $self->{cgi}->param('id') || undef;
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
    $self->{game} = ( $self->{do} eq 'replay' ) ? BCF::Game->new($self->{id}, 1)
                                                : BCF::Game->new($self->{id});
    $self->{bcf} = ( $self->{id} && !$self->{bcf} )? 0 : 1;
    $self->{game}->set_bcf_mode($self->{bcf});
    $self->{id} = $self->{game}{id};
}

sub validate_passwd {
    my ($self, $pwd) = @_;
    $pwd = sha1_hex $pwd;
    return grep /^$pwd$/, @{ $self->{keys} };
}

sub do_selector {
    my $self = shift;
    if ( ! $self->{do} ) {    
    ## normal playing 
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
    } elsif ( $self->{do} eq 'undo' ) {
        $self->{game}->undo_move;

    } elsif ( $self->{do} eq 'save' ) {
        $self->{msg} =~ s/^\s+|\s+$//g;
        return unless $self->validate_passwd($self->{pwd});
        return unless $self->{msg};
        $self->{game}->save_gamelist($self->{id}, $self->{msg});
        $self->{alert} = 'The game has been saved.';
        $self->{locked} = 1;

    } elsif ( $self->{do} eq 'replay' ) {
        $self->{replay} = 1;
        $self->{locked} = 1;
        return unless defined $self->{go};
        $self->{game}->goto_move($self->{go});
    } elsif ( $self->{do} eq 'delete' ) {
        $self->{replay} = 1;
        $self->{locked} = 1;
        return unless $self->validate_passwd($self->{pwd});
        return unless defined $self->{did};
        $self->{game}->delete_gamelist($self->{did});
    }
}

sub process {
    my $self = shift;
    $self->do_selector;
    $self->{pB} = $self->{game}{pB};
    $self->{pW} = $self->{game}{pW};
    $self->{eB} = $self->{game}{eB};
    $self->{eW} = $self->{game}{eW};
    $self->{view} = $self->{game}->ravel_board;
    $self->{board} = $self->{game}{board};
    $self->{gamelist} = $self->{game}->load_gamelist;
    $self->{game}->save_game;
}

sub dump_template {
    my $self = shift;
    my $t = Template->new();
    print $self->{cgi}->header( -charset => 'UTF-8' );
    $t->process($self->{template}, $self);
}

1;
