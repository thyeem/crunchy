#!/usr/bin/perl -I/home/ubuntu/perl5/lib/perl5

use strict;
use warnings;
use Data::Dumper;
use Fcntl qw/ :DEFAULT :flock /;
use CGI;
use GD;
GD::Image->trueColor(1);

use constant NL => 19;
use constant CT => (NL+1)/2;
use constant TW => 30;
use constant TH => 30;
use constant BW => TW * NL;
use constant BH => TH * NL;

my $img  = new GD::Image(BW, BH);
my $e_cr = GD::Image->newFromPng('img/30px/cross.png');
my $e_cd = GD::Image->newFromPng('img/30px/cross_dot.png');
my $e_tt = GD::Image->newFromPng('img/30px/top.png');
my $e_bb = GD::Image->newFromPng('img/30px/bottom.png');
my $e_ll = GD::Image->newFromPng('img/30px/left.png');
my $e_rr = GD::Image->newFromPng('img/30px/right.png');
my $e_tl = GD::Image->newFromPng('img/30px/top-left.png');
my $e_tr = GD::Image->newFromPng('img/30px/top-right.png');
my $e_bl = GD::Image->newFromPng('img/30px/bot-left.png');
my $e_br = GD::Image->newFromPng('img/30px/bot-right.png');
my $e_bs = GD::Image->newFromPng('img/30px/black.png');
my $e_ws = GD::Image->newFromPng('img/30px/white.png');

sub place_tile {
    my ($obj, $img, $x, $y) = @_;
    $img->copyResampled($obj, ($x-1) * TW, ($y-1) * TH, 0, 0, TW, TH, TW, TH);
}

for my $i ( 1 .. NL ) {
    for my $j ( 1 .. NL ) {
        ( $i == 1 )  ? place_tile($e_ll, $img, $i, $j) :
        ( $i == NL ) ? place_tile($e_rr, $img, $i, $j) :
        ( $j == 1 )  ? place_tile($e_tt, $img, $i, $j) :
        ( $j == NL ) ? place_tile($e_bb, $img, $i, $j) : place_tile($e_cr, $img, $i, $j);
    }
}

## cross_dot
place_tile($e_tl, $img, 1, 1);
place_tile($e_tr, $img, NL, 1);
place_tile($e_bl, $img, 1, NL);
place_tile($e_br, $img, NL, NL);
place_tile($e_cd, $img, 4, 4);
place_tile($e_cd, $img, 4, NL-3);
place_tile($e_cd, $img, NL-3, 4);
place_tile($e_cd, $img, NL-3, NL-3);
place_tile($e_cd, $img, CT, CT);
## if NL == 19
place_tile($e_cd, $img, CT, 4);
place_tile($e_cd, $img, 4, CT);
place_tile($e_cd, $img, NL-3, CT);
place_tile($e_cd, $img, CT, NL-3);


## place move
open my $png, '>', "img/board.png";
binmode $png;
print {$png} $img->png;
close $png;
