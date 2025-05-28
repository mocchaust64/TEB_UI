import axios from 'axios';

// Pinata API keys - nên được lưu trong biến môi trường
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';

/**
 * Pin JSON metadata lên IPFS
 * @param metadata - JSON metadata object
 * @returns Metadata URI trên IPFS
 */
export async function pinJSONToIPFS(metadata: Record<string, any>): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT không được cấu hình');
    }

    // Nếu có token metadata image dạng base64, tải lên IPFS trước
    if (metadata.image && typeof metadata.image === 'string' && metadata.image.startsWith('data:image')) {
      const imageUrl = await pinImageFromBase64(metadata.image);
      metadata.image = imageUrl; 
    }

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
      }
    );
    
    // Trả về URI dạng IPFS protocol
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error("Error pinning JSON to IPFS:", error);
    throw new Error(`Failed to upload metadata: ${error.message}`);
  }
}

/**
 * Pin image từ base64 string lên IPFS
 * @param base64Image - Chuỗi base64 của hình ảnh
 * @returns Image URL trên IPFS
 */
export async function pinImageFromBase64(base64Image: string): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT không được cấu hình');
    }

    // Tách data URI để lấy thông tin mime type và dữ liệu base64
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const fileExt = mimeType.split('/')[1];
    

    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: mimeType });
    

    const fileName = `token-image-${Date.now()}.${fileExt}`;
    

    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    const metadataPart = JSON.stringify({
      name: fileName,
    });
    formData.append('pinataMetadata', metadataPart);
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${PINATA_JWT}`,
        
        },
      }
    );
    
 
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error("Error pinning image to IPFS:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Pin file dạng base64 string lên IPFS
 * @param base64Data - Chuỗi base64 của file (không bao gồm prefix data URI)
 * @param fileName - Tên file để lưu trữ
 * @returns File URL trên IPFS
 */
export async function pinFileToIPFS(base64Data: string, fileName: string): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT không được cấu hình');
    }

    // Giả định rằng file là hình ảnh PNG
    const mimeType = 'image/png';
    const fileExt = 'png';
    
    // Tạo blob từ base64
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: mimeType });
    
    // Đặt tên file
    const fullFileName = `${fileName}-${Date.now()}.${fileExt}`;
    
    // Tạo formData để gửi lên Pinata
    const formData = new FormData();
    formData.append('file', blob, fullFileName);
    
    const metadataPart = JSON.stringify({
      name: fullFileName,
    });
    formData.append('pinataMetadata', metadataPart);
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${PINATA_JWT}`,
        },
      }
    );
    
    // Trả về URI dạng IPFS protocol
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error("Error pinning file to IPFS:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Chuyển đổi từ IPFS URI sang HTTP gateway URL
 * @param ipfsURI - IPFS URI trong định dạng ipfs://...
 * @returns HTTP URL sử dụng Pinata gateway
 */
export function ipfsToHTTP(ipfsURI: string): string {
  if (!ipfsURI) return '';
  

  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
  

  if (ipfsURI.startsWith('http')) {
    return ipfsURI;
  }
  

  if (ipfsURI.startsWith('ipfs://')) {
    return ipfsGateway + ipfsURI.replace('ipfs://', '');
  }
  

  return ipfsGateway + ipfsURI;
}

/**
 * Tải ảnh lên IPFS và trả về URL HTTP
 * @param file - File ảnh để tải lên
 * @param fileName - Tên file tùy chọn
 * @returns HTTP URL của ảnh đã tải lên
 */
export async function uploadImageAndGetUrl(file: File, fileName?: string): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT không được cấu hình');
    }

    // Tạo formData để gửi lên Pinata
    const formData = new FormData();
    formData.append('file', file);
    
    const metadataPart = JSON.stringify({
      name: fileName || file.name || `token-image-${Date.now()}`,
    });
    formData.append('pinataMetadata', metadataPart);
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${PINATA_JWT}`,
        },
      }
    );
    
    // Lấy IPFS hash từ response
    const ipfsHash = response.data.IpfsHash;
    
    // Trả về HTTP URL
    const httpUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    return httpUrl;
  } catch (error: any) {
    console.error("Error uploading image:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
} 