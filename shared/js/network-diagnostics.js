(function (global) {
  var VPN_PROVIDERS = [
    'nordvpn', 'expressvpn', 'surfshark', 'private internet access', 'mullvad', 'protonvpn', 'proton ag',
    'cyberghost', 'ipvanish', 'windscribe', 'tunnelbear', 'hotspot shield', 'hidemyass', 'strongvpn',
    'vyprvpn', 'atlas vpn', 'privatevpn', 'purevpn', 'zenmate', 'torguard', 'astrill', 'hide.me',
    'perfect privacy', 'fastestvpn', 'ivpn', 'airvpn', 'vpn unlimited', 'keepsolid', 'buffered vpn',
    'encrypt.me', 'ghostpath', 'betternet', 'speedify', 'opera vpn', 'mozilla vpn', 'wireguard',
    'outline vpn', 'psiphon', 'lantern', 'browsec', 'hola', 'urban vpn', 'touch vpn', 'x-vpn',
    'thunder vpn', 'secure vpn', 'vpn super', 'turbo vpn', 'snap vpn', 'yoga vpn', 'vpn proxy master',
    'kaspersky', 'bitdefender vpn', 'norton vpn', 'avast vpn', 'avg vpn', 'malwarebytes vpn'
  ];

  var DATACENTER_PATTERNS = [
    'digital ocean', 'digitalocean', 'amazon', 'aws', 'google cloud', 'gcp', 'microsoft azure', 'azure',
    'hetzner', 'ovh', 'ovhcloud', 'vultr', 'linode', 'akamai connected', 'cloudflare', 'leaseweb',
    'choopa', 'the constant company', 'm247', 'datacamp', 'hostwinds', 'contabo', 'ionos', 'scaleway',
    'upcloud', 'cherry servers', 'kamatera', 'hostinger', 'quadranet', 'psychz', 'colocrossing',
    'multacom', 'sharktech', 'reliablesite', 'datapacket', 'zenlayer', 'serverius', 'combahton',
    'frantech', 'buyvm'
  ];

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(value)));
    return div.innerHTML;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var opts = options || {};
    var ms = timeoutMs || 7000;

    if (typeof AbortController !== 'undefined') {
      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, ms);
      opts.signal = controller.signal;
      return fetch(url, opts).then(function (response) {
        clearTimeout(timer);
        return response;
      }).catch(function (err) {
        clearTimeout(timer);
        throw err;
      });
    }

    return new Promise(function (resolve, reject) {
      var timedOut = false;
      var timeout = setTimeout(function () {
        timedOut = true;
        reject(new Error('Request timed out'));
      }, ms);

      fetch(url, opts).then(function (response) {
        if (timedOut) return;
        clearTimeout(timeout);
        resolve(response);
      }).catch(function (err) {
        if (timedOut) return;
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  function fetchJson(url, options, timeoutMs) {
    return fetchWithTimeout(url, options, timeoutMs).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    });
  }

  function getPublicIpInfo() {
    return fetchJson('https://ipinfo.io/json', { cache: 'no-store' }, 7000).then(function (data) {
      if (data.error || data.bogon) {
        throw new Error('IP info unavailable');
      }
      return {
        ip: data.ip || 'Unknown',
        org: data.org || 'Unknown',
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
        timezone: data.timezone || '',
        source: 'ipinfo'
      };
    }).catch(function () {
      return fetchJson('https://api.ipify.org?format=json', { cache: 'no-store' }, 5000).then(function (data) {
        return {
          ip: data.ip || 'Unknown',
          org: 'Unknown',
          city: '',
          region: '',
          country: '',
          timezone: '',
          source: 'ipify'
        };
      });
    });
  }

  function isPrivateIp(ip) {
    var value = String(ip || '').toLowerCase();
    if (!value) return false;
    if (value.indexOf('::1') === 0 || value.indexOf('fe80:') === 0 || value.indexOf('fc') === 0 || value.indexOf('fd') === 0) {
      return true;
    }
    if (/^(10\.|127\.|192\.168\.|169\.254\.)/.test(value)) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) {
      return true;
    }
    return false;
  }

  function checkWebRTC(timeoutMs) {
    return new Promise(function (resolve) {
      var RTCPeer = global.RTCPeerConnection || global.webkitRTCPeerConnection || global.mozRTCPeerConnection;
      if (!RTCPeer) {
        resolve({
          supported: false,
          ips: [],
          privateIps: [],
          publicIps: [],
          error: 'WebRTC not supported'
        });
        return;
      }

      var pc;
      var ips = [];
      var ipMap = {};

      function addCandidateIp(candidate) {
        if (!candidate) return;
        var parts = candidate.split(' ');
        var ip = parts[4];
        if (!ip) return;
        if (ip.indexOf('.') === -1 && ip.indexOf(':') === -1) return;
        if (ipMap[ip]) return;
        ipMap[ip] = true;
        ips.push(ip);
      }

      function finish(error) {
        try {
          if (pc) pc.close();
        } catch (closeErr) {
          // Ignore close errors.
        }

        var privateIps = [];
        var publicIps = [];
        for (var i = 0; i < ips.length; i++) {
          if (isPrivateIp(ips[i])) privateIps.push(ips[i]);
          else publicIps.push(ips[i]);
        }

        resolve({
          supported: true,
          ips: ips,
          privateIps: privateIps,
          publicIps: publicIps,
          error: error || ''
        });
      }

      try {
        pc = new RTCPeer({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pc.createDataChannel('');
        pc.onicecandidate = function (event) {
          if (!event || !event.candidate || !event.candidate.candidate) return;
          addCandidateIp(event.candidate.candidate);
        };
        pc.createOffer().then(function (offer) {
          return pc.setLocalDescription(offer);
        }).catch(function (err) {
          finish(err && err.message ? err.message : 'WebRTC offer failed');
        });
        setTimeout(function () {
          finish('');
        }, timeoutMs || 3500);
      } catch (err) {
        finish(err && err.message ? err.message : 'WebRTC test failed');
      }
    });
  }

  function detectNetworkProvider(org) {
    var value = String(org || '').toLowerCase();
    if (!value || value === 'unknown') {
      return { match: false, kind: 'unknown', name: '', label: 'Unknown provider' };
    }

    for (var i = 0; i < VPN_PROVIDERS.length; i++) {
      if (value.indexOf(VPN_PROVIDERS[i]) !== -1) {
        return { match: true, kind: 'vpn', name: VPN_PROVIDERS[i], label: 'Known VPN provider detected' };
      }
    }

    for (var j = 0; j < DATACENTER_PATTERNS.length; j++) {
      if (value.indexOf(DATACENTER_PATTERNS[j]) !== -1) {
        return { match: true, kind: 'datacenter', name: DATACENTER_PATTERNS[j], label: 'Datacenter or server network detected' };
      }
    }

    return { match: false, kind: 'residential', name: '', label: 'No VPN or datacenter match found' };
  }

  function probeEncryptedDns() {
    var providers = [
      {
        id: 'cloudflare',
        name: 'Cloudflare DNS-over-HTTPS',
        url: 'https://cloudflare-dns.com/dns-query?name=example.com&type=A&rand=' + Date.now(),
        options: {
          headers: { Accept: 'application/dns-json' },
          cache: 'no-store'
        }
      },
      {
        id: 'google',
        name: 'Google Public DNS-over-HTTPS',
        url: 'https://dns.google/resolve?name=example.com&type=A&rand=' + Date.now(),
        options: {
          cache: 'no-store'
        }
      }
    ];

    return Promise.all(providers.map(function (provider) {
      var start = performance.now();
      return fetchJson(provider.url, provider.options, 7000).then(function (data) {
        return {
          id: provider.id,
          name: provider.name,
          reachable: true,
          latency: Math.round(performance.now() - start),
          answers: data.Answer ? data.Answer.length : 0,
          error: ''
        };
      }).catch(function (err) {
        return {
          id: provider.id,
          name: provider.name,
          reachable: false,
          latency: Math.round(performance.now() - start),
          answers: 0,
          error: err && err.message ? err.message : 'Request failed'
        };
      });
    }));
  }

  global.TeamzNetworkDiagnostics = {
    copyText: copyText,
    escapeHtml: escapeHtml,
    fetchWithTimeout: fetchWithTimeout,
    fetchJson: fetchJson,
    getPublicIpInfo: getPublicIpInfo,
    isPrivateIp: isPrivateIp,
    checkWebRTC: checkWebRTC,
    detectNetworkProvider: detectNetworkProvider,
    probeEncryptedDns: probeEncryptedDns
  };
})(window);
