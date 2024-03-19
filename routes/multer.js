const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        const uniquename = uuidv4();
        cb(null, uniquename + path.extname(file.originalname))
    }
});

function fileFilter(req, file, cb) {

    const fext = path.extname(file.originalname);
    if (fext === '.png' || fext === '.jpg' || fext === '.webp' || fext === '.jpeg' || fext === '.avif') {
        cb(null, true)
    }
    else {
        cb(new Error("Invalid File Type"))
    }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
module.exports = upload;