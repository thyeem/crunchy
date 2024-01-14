use strict;
use warnings;

package BCF::Config;
use base qw / Exporter /;
our @EXPORT = qw / NL GOAL HUMAN SOFIAI MARIAI BLACK WHITE EMPTY VP /;

use constant {
    NL => 13,
    GOAL => 5,
    HUMAN => 'human',
    SOFIAI => 'sofia',
    MARIAI => 'maria',
    BLACK  => 'b',
    WHITE  => 'w',
    EMPTY  => '',
    VP     => 10,
};

sub new {
    my $class = shift;
    my $self = {
	title      => 'Crunchy',
        template   => 'main.html',
        css_bcf    => 'css/bcf.css',
        css_fa     => 'css/font-awesome.min.css',
        js_bcf     => 'js/bcf.js',
        js_jquery  => 'js/jquery-3.6.0.min.js',
        js_hasher  => 'js/sha256.js',
        letter     => 'xxxxx.dat',
        S          => '&nbsp;',
        M          => '&ensp;',
        L          => '&emsp;',
        dash       => '&mdash;',
        method     => 'post',
        cgi        => undef,
        game       => undef,
        ____       => [
                        'd02891e121f8270dbceeea04bc915831773af6b19c5653fa51b7cb0e793981e9',
                      ],
        keys       => [
                        'eb92fa268853db52ba44fc55962691427b3c4f830cebeaddc8fc47998d9395fc',
                        '0a43696fbd9aa7f51359d524c85bd260eb85c017e4ac345b88edb2b1a7f8c9be',
                      ],
        #------------------------------------------------
        HUMAN      => HUMAN,
        SOFIAI     => SOFIAI,
        MARIAI     => MARIAI,
        BLACK      => BLACK,
        WHITE      => WHITE,
        EMPTY      => EMPTY,
        NL         => NL,
        UNIT       => 30 * 1.5,
        locked     => 0,
        alert      => '',
        view       => '',
        gamelist   => [],
        board      => undef,
        do         => undef,
        id         => undef,
        go         => undef,
        pB         => undef,
        pW         => undef,
        eB         => undef,
        eW         => undef,
        bcf        => undef,
        msg        => undef,
        x          => undef,
        y          => undef,
    };
    bless $self, $class;
    return $self;
}

1;
