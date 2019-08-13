#!/usr/bin/perl  

use strict;
use warnings;
use lib '/home/ubuntu/perl5/lib/perl5';
use feature qw/ say /;
use JSON;
use CGI;
use BCF::Game;
use BCF::Config;

my $debug = 0;
my $cgi = CGI->new;
print $cgi->header(-type => 'application/json', -charset => 'utf-8');

# parse ajax data requested ------------------------
my $id    = $cgi->param('id') || undef;
my $bcf   = $cgi->param('bcf') || 0;
my $turn  = $cgi->param('turn') || EMPTY;
my $agent = $cgi->param('agent') || HUMAN;

exit 1 unless $id;
exit 1 unless -e "tmp/$id";
exit 1 unless ($turn eq BLACK || $turn eq WHITE);
exit 1 unless ($agent eq SOFIAI || $agent eq MARIAI);

# prepare the AI gaming environment ----------------
my $g = BCF::Game->new($id);
exit 1 if $turn ne $g->whose_turn;

my $ext = ( $bcf ) ? '' : '.x';
my $bin = "bin/${agent}${ext}";
my $api_board = "tmp/$id.ai";
$g->write_api_board($api_board);
exit 1 unless -e $api_board;

# let AIs play the game instead --------------------
eval {
    local $SIG{ALRM} = sub { exit 1 };
    alarm 60;
    system($bin, $api_board);
    alarm 0;
};
## system($bin, $api_board);
my ($x, $y) = $g->read_api_board($api_board, 1);
return if $x < 0 || $y < 0;

# JSON response to ajax request --------------------
my $json = JSON->new->utf8->pretty(1)->encode({
    x => $x+1, 
    y => $y+1, 
});

print $json;
