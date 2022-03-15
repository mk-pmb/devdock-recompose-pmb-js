
Custom IP range
===============

Unfortunately, custom IP config
[seems to not be supported](https://github.com/docker/compose/issues/3962)
in docker-compose v3 yet.


In v2, it would probably have worked like this:

```yaml
networks:
  default:
    ipam:
       config:
         - subnet:     172.42.0.0/24
           ip_range:   172.42.23.0/24
           gateway:    172.42.23.255
           aux_addreses:
               db: 172.42.23.8
```
