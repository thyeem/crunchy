
use feature qw/ say /;
use Storable qw / lock_nstore lock_retrieve /;
use IPC::Run qw/ run timeout /;

## use BCF::Board;
use BCF::Game;
use BCF::Config;
use constant N => 19;

