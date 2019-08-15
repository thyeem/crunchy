
use feature qw/ say /;
use Storable qw / lock_nstore lock_retrieve /;
use IPC::Run qw/ run timeout /;

use BCF::Board;
use BCF::Game;
use BCF::Config;
use Data::Dump qw/ dump /;
## use constant N => 19;

sub print_sav {
    my $db = lock_retrieve 'sav/game.list';
    for my $f (keys %${db}) {
        my ($b, $g) = @{ lock_retrieve "sav/$f" }[0, 1];
        say $f;
        say dump($g);
    }
}

sub convert_sav {
    my $db = lock_retrieve 'sav/game.list';
    for my $f (keys %${db}) {
        say $f;
        my ($b, $g) = @{ lock_retrieve "sav/$f" }[0, 1];
        my $e = [];
        for $xy (@{$g}) {
            my $d = {};
            $d->{xy} = $xy;
            $d->{pB} = HUMAN;
            $d->{pW} = HUMAN;
            $d->{eB} = '50.0';
            $d->{eW} = '50.0';
            push @{$e}, $d;
        }
        say dump($e);
        lock_nstore [$b, $e], "sav/$f";
    }
}

