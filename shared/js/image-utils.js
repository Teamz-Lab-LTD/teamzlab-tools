/**
 * Teamz Lab Tools — Image Processing Utilities
 * Client-side image manipulation using HTML5 Canvas API.
 * Used by all image tools (compressor, resizer, converter, etc.)
 */

var ImageUtils = (function () {

  function loadImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        callback(img, {
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          name: file.name,
          type: file.type
        });
      };
      img.onerror = function () {
        callback(null, null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resizeImage(img, maxWidth, maxHeight, quality, format, callback) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
    canvas.width = Math.round(img.naturalWidth * ratio);
    canvas.height = Math.round(img.naturalHeight * ratio);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    var mime = _getMime(format || 'jpeg');
    var q = (quality || 80) / 100;

    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      callback(blob, url, { width: canvas.width, height: canvas.height });
    }, mime, q);
  }

  function compressToTargetSize(img, targetBytes, format, callback) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    var mime = _getMime(format || 'jpeg');
    var lo = 0.01;
    var hi = 1.0;
    var bestBlob = null;
    var attempts = 0;
    var maxAttempts = 15;

    function tryQuality() {
      if (attempts >= maxAttempts) {
        // If still too big, also try reducing dimensions
        if (bestBlob && bestBlob.size > targetBytes) {
          var scale = Math.sqrt(targetBytes / bestBlob.size) * 0.9;
          var newW = Math.round(canvas.width * scale);
          var newH = Math.round(canvas.height * scale);
          var c2 = document.createElement('canvas');
          c2.width = newW;
          c2.height = newH;
          c2.getContext('2d').drawImage(img, 0, 0, newW, newH);
          c2.toBlob(function (b) {
            callback(b || bestBlob, URL.createObjectURL(b || bestBlob), { width: newW, height: newH });
          }, mime, 0.7);
        } else {
          callback(bestBlob, bestBlob ? URL.createObjectURL(bestBlob) : null, { width: canvas.width, height: canvas.height });
        }
        return;
      }

      var mid = (lo + hi) / 2;
      attempts++;

      canvas.toBlob(function (blob) {
        if (!blob) { callback(null, null, {}); return; }

        if (blob.size <= targetBytes) {
          bestBlob = blob;
          lo = mid;
        } else {
          hi = mid;
        }

        if (hi - lo < 0.02 || (bestBlob && Math.abs(bestBlob.size - targetBytes) / targetBytes < 0.1)) {
          callback(bestBlob || blob, URL.createObjectURL(bestBlob || blob), { width: canvas.width, height: canvas.height });
          return;
        }

        tryQuality();
      }, mime, mid);
    }

    tryQuality();
  }

  function convertFormat(img, targetFormat, quality, callback) {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');

    // White background for JPEG (no transparency)
    if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    var mime = _getMime(targetFormat);
    var q = (quality || 90) / 100;

    canvas.toBlob(function (blob) {
      callback(blob, URL.createObjectURL(blob), { width: canvas.width, height: canvas.height });
    }, mime, q);
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function _getMime(format) {
    var map = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return map[format] || 'image/jpeg';
  }

  function getExtension(format) {
    if (format === 'jpeg') return 'jpg';
    return format || 'jpg';
  }

  return {
    loadImage: loadImage,
    resizeImage: resizeImage,
    compressToTargetSize: compressToTargetSize,
    convertFormat: convertFormat,
    formatFileSize: formatFileSize,
    getExtension: getExtension
  };
})();
