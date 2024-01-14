#!/usr/bin/perl 

use feature qw/ say /;
use Storable qw / lock_nstore lock_retrieve /;
use Data::Dump qw/ dump /;

BEGIN { unshift @INC, '.'; }
use BCF::Board;
use BCF::Game;
use BCF::Config;

sub print_sav {
    my $db = lock_retrieve 'sav/game.list';
    for my $f (sort { $db->{$a}{time} <=> $db->{$b}{time} } keys %{$db}) {
        my ($b, $g) = @{ lock_retrieve "sav/$f" }[0, 1];
        say $f;
        say dump($g);
    }
}

sub convert_sav {
    my $db = lock_retrieve 'sav/game.list';
    for my $f (sort { $db->{$a}{time} <=> $db->{$b}{time} } keys %{$db}) {
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

print_sav;
