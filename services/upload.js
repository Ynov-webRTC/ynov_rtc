const multer = require('multer');
const crypto = require('crypto');
const mime = require('mime');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/img/avatar');
    },
    filename: function(req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(err, raw.toString('hex') + '.' + mime.extension(file.mimetype));
        });
    }
});
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        let extensions = ['jpg', 'jpeg', 'png', 'bmp', 'gif'];
        let ext = mime.extension(file.mimetype);
        if(extensions.indexOf(ext) != -1) {
            cb(null, true);
        }else {
            cb(new Error('Fichier incorrect'));
        }
    }
}).single('avatar');

module.exports = upload;
