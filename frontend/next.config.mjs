/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Ảnh sân thật: seed dùng Unsplash, ảnh chủ sân upload nằm trên Supabase
    // Storage. Ảnh lưu ở ổ đĩa (http://localhost:3000/uploads/...) và ảnh mock
    // (blob:) được đánh `unoptimized` ngay trong <CourtImage> nên không cần khai
    // báo host động ở đây.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
