# wisnuc-bootstrap-update
The reworked wisnuc-bootstrap auto-update based on nexe.



## Dists

Github repo files (not release) are used for checking update, downloading file and verifying checksum.

The target repo is: http://github.com/wisnuc/wisnuc-bootstrap, `release` branch is used. The following files are used:

1. wisnuc-bootstrap-linux-x64
2. wisnuc-bootstrap-linux-x64-sha256
3. wisnuc-bootstrap-linux-a64
4. wisnuc-bootstrap-linux-a64-sha256

`x64` stands for x86_64 platform and `a64` for arm v8.

`wisnuc-bootstrap-linux-*` are nexe-packaged executables and `wisnuc-bootstrap-linux-*-sha256` are one-line plain text file containing the corresponding sha256 hex string.



All files are prepended with the following url when downloading from github:

https://raw.githubusercontent.com/wisnuc/wisnuc-bootstrap/release/



## Mirrors

The mirror server is `mirrors.wisnuc.com`. Https is required.

The server may cache file locally. If so, it should guarantee that the sha256 and binary executables are in sync.

https://mirrors.wisnuc.com/wisnuc-bootstrap/wisnuc-bootstrap-linux-x64
https://mirrors.wisnuc.com/wisnuc-bootstrap/wisnuc-bootstrap-linux-x64-sha256
https://mirrors.wisnuc.com/wisnuc-bootstrap/wisnuc-bootstrap-linux-a64
https://mirrors.wisnuc.com/wisnuc-bootstrap/wisnuc-bootstrap-linux-a64-sha256



## Deployment

This program is supposed to be installed as `/wisnuc/wisnuc-bootstrap-update`. A `systemd` service can be configured to launch the program periodically.



The downloaded file should be stored as `/wisnuc/wisnuc-bootstrap`, without suffix indicating platform and architecture.



All temporary files should be located in `/wisnuc/wisnuc-bootstrap-update-tmp`. This directory should not be used by other programs to avoid conflict.





