#FROM ruby
#RUN gem install youplot


FROM golang
RUN apt update  \
  && apt upgrade -y  \
  && apt autoremove -y \
  && apt install -y systemd libssl-dev

# COPY --from=journal /lib/aarch64-linux-gnu/libc.so.6 /lib/aarch64-linux-gnu/libc.so.6
# COPY --from=journal /lib/ld-linux-aarch64.so.1 /lib/ld-linux-aarch64.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/librt.so.1 /lib/aarch64-linux-gnu/librt.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libcap.so.2 /lib/aarch64-linux-gnu/libcap.so.2
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libacl.so.1 /usr/lib/aarch64-linux-gnu/libacl.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libcryptsetup.so.12 /lib/aarch64-linux-gnu/libcryptsetup.so.12
# COPY --from=journal /lib/aarch64-linux-gnu/libgcrypt.so.20 /lib/aarch64-linux-gnu/libgcrypt.so.20
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libip4tc.so.2 /usr/lib/aarch64-linux-gnu/libip4tc.so.2
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libkmod.so.2 /usr/lib/aarch64-linux-gnu/libkmod.so.2
# COPY --from=journal /lib/aarch64-linux-gnu/libmount.so.1 /lib/aarch64-linux-gnu/libmount.so.1
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libseccomp.so.2 /usr/lib/aarch64-linux-gnu/libseccomp.so.2
# COPY --from=journal /lib/aarch64-linux-gnu/libselinux.so.1 /lib/aarch64-linux-gnu/libselinux.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/liblzma.so.5 /lib/aarch64-linux-gnu/liblzma.so.5
# COPY --from=journal /usr/lib/aarch64-linux-gnu/liblz4.so.1 /usr/lib/aarch64-linux-gnu/liblz4.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libblkid.so.1 /lib/aarch64-linux-gnu/libblkid.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libpthread.so.0 /lib/aarch64-linux-gnu/libpthread.so.0
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libattr.so.1 /usr/lib/aarch64-linux-gnu/libattr.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libuuid.so.1 /lib/aarch64-linux-gnu/libuuid.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libdevmapper.so.1.02.1 /lib/aarch64-linux-gnu/libdevmapper.so.1.02.1
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libssl.so.3 /usr/lib/aarch64-linux-gnu/libssl.so.3
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libargon2.so.1 /usr/lib/aarch64-linux-gnu/libargon2.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libdl.so.2 /lib/aarch64-linux-gnu/libdl.so.2
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libjson-c.so.5 /usr/lib/aarch64-linux-gnu/libjson-c.so.5
# COPY --from=journal /lib/aarch64-linux-gnu/libgpg-error.so.0 /lib/aarch64-linux-gnu/libgpg-error.so.0
# COPY --from=journal /lib/aarch64-linux-gnu/libudev.so.1 /lib/aarch64-linux-gnu/libudev.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libm.so.6 /lib/aarch64-linux-gnu/libm.so.6
# COPY --from=journal /usr/lib/aarch64-linux-gnu/systemd/libsystemd-shared-252.so /usr/lib/aarch64-linux-gnu/systemd/libsystemd-shared-252.so
# COPY --from=journal /lib/aarch64-linux-gnu/libpam.so.0 /lib/aarch64-linux-gnu/libpam.so.0
# COPY --from=journal /lib/aarch64-linux-gnu/libpcre2-8.so.0 /lib/aarch64-linux-gnu/libpcre2-8.so.0
# COPY --from=journal /lib/aarch64-linux-gnu/libaudit.so.1 /lib/aarch64-linux-gnu/libaudit.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libzstd.so.1 /lib/aarch64-linux-gnu/libzstd.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libcrypto.so.3 /lib/aarch64-linux-gnu/libcrypto.so.3
# COPY --from=journal /lib/aarch64-linux-gnu/libcrypt.so.1 /lib/aarch64-linux-gnu/libcrypt.so.1
# COPY --from=journal /lib/aarch64-linux-gnu/libcap-ng.so.0 /lib/aarch64-linux-gnu/libcap-ng.so.0
# COPY --from=journal /usr/lib/aarch64-linux-gnu/libcap-ng.so.0.0.0 /lib/aarch64-linux-gnu/libcap-ng.so.0.0.0
# COPY --from=journal /usr/bin/journalctl /usr/bin/journalctl
# COPY --from=journal /etc/systemd/ /etc/systemd

COPY go.mod go.sum ./
RUN go mod download

COPY *.go .
RUN CGO_ENABLED=0 GOOS=linux go build -o main main.go

CMD ["./main", "|", "systemd-cat"]