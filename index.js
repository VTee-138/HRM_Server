const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const pool = require('./database'); // Đảm bảo file database.js của bạn đã được cấu hình
const { createFolder, uploadFileToDrive } = require('./googleDrive');
const fs = require('fs');

// --- KHỞI TẠO ỨNG DỤNG ---
const app = express();
const port = 5000;

// --- CẤU HÌNH MIDDLEWARE ---

// 1. CORS
const allowedOrigins = [
  'https://hrm.info.aipencil.name.vn',
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// 2. Middleware cho file tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Cấu hình Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });


// --- ĐỊNH NGHĨA API ROUTE ---
app.options('/hrminfo', cors()); // Xử lý CORS Preflight

app.post(
  '/hrminfo',
  upload.fields([
    { name: 'staffPhoto', maxCount: 1 },
    { name: 'citizenFront', maxCount: 1 },
    { name: 'citizenBack', maxCount: 1 }
  ]),
  async (req, res) => {
    const form = req.body;
    const files = req.files;

  // Nếu dùng Cloudinary, upload trực tiếp từ Buffer:
  // Ví dụ:
  // const cloudinary = require('cloudinary').v2;
  // const uploadCloudinary = async (file) => {
  //   if (!file) return null;
  //   const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => { ... });
  //   return result.secure_url;
  // };

  // Nếu chưa dùng Cloudinary, lưu tạm link null:
  const staffPhotoLink = null;
  const citizenFrontLink = null;
  const citizenBackLink = null;

    try {
      // SỬA LỖI: Cập nhật câu lệnh INSERT để khớp với schema
      // Sử dụng dấu "" để đảm bảo tên cột case-sensitive
      const query = `
        INSERT INTO hrminfo (
          "Ho_Va_Ten", "Gioi_Tinh", "Ngay_Thang_Nam_Sinh", "Hinh_Thuc_Cong_Viec", "Ngay_Bat_Dau_Lam_Viec", 
          "Hinh_Thuc_Lam_Viec", "Chuc_Vu", "Phong_Ban", "Thuong_Hieu", "Noi_Lam_Viec", "Ten_Don_Vi", 
          "So_Dien_Thoai", "Email", "Link_Facebook", "So_Tai_Khoan_VPBank", 
          "Chu_Tai_Khoan_VPBank", "Chi_Nhanh_VPBank", "So_Can_Cuoc_Cong_Dan", "Dia_Chi_Thuong_Tru", 
          "Dia_Chi_Hien_Tai", "Anh_The_Nhan_Vien_Link", "Anh_CCCD_Mat_Truoc_Link", "Anh_CCCD_Mat_Sau_Link", 
          "Bien_So_Xe", "Tham_Gia_Nhom_Rieng", "Cam_Doan"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26
        ) RETURNING "ID";
      `;

      // Cập nhật mảng values cho bảng mới
      const values = [
        form.fullName,          // $1: Ho_Va_Ten
        form.gender,            // $2: Gioi_Tinh
        form.dob || null,       // $3: Ngay_Thang_Nam_Sinh
        form.position,          // $4: Hinh_Thuc_Cong_Viec
        form.startDate || null, // $5: Ngay_Bat_Dau_Lam_Viec
        form.workType,          // $6: Hinh_Thuc_Lam_Viec
        form.role,              // $7: Chuc_Vu
        form.department,        // $8: Phong_Ban
        form.memberOf,          // $9: Thuong_Hieu
        form.workPlace,         // $10: Noi_Lam_Viec
        form.unitName,          // $11: Ten_Don_Vi
        form.phone,             // $12: So_Dien_Thoai
        form.email,             // $13: Email
        form.facebook,          // $14: Link_Facebook
        form.vpBankAccount,     // $15: So_Tai_Khoan_VPBank
        form.vpBankOwner,       // $16: Chu_Tai_Khoan_VPBank
        form.vpBankBranch,      // $17: Chi_Nhanh_VPBank
        form.citizenId,         // $18: So_Can_Cuoc_Cong_Dan
        form.permanentAddress,  // $19: Dia_Chi_Thuong_Tru
        form.currentAddress,    // $20: Dia_Chi_Hien_Tai
        staffPhotoLink,         // $21: Anh_The_Nhan_Vien_Link
        citizenFrontLink,       // $22: Anh_CCCD_Mat_Truoc_Link
        citizenBackLink,        // $23: Anh_CCCD_Mat_Sau_Link
        form.vehiclePlate,      // $24: Bien_So_Xe
        form.joinInternalGroup, // $25: Tham_Gia_Nhom_Rieng
        form.confirm            // $26: Cam_Doan
      ];

      const result = await pool.query(query, values);
      res.status(201).json({ success: true, message: 'Thông tin đã được lưu thành công!', id: result.rows[0].id });

    } catch (err) {
      console.error('Database Error:', err.stack);
      res.status(500).json({ success: false, error: 'Lỗi khi lưu thông tin vào cơ sở dữ liệu. Chi tiết: ' + err.message });
    }
  }
);

// --- KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
