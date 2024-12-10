import { Prisma } from '@prisma/client';

export const banks: Prisma.BankCreateInput[] = [
    { 
        nameEn: 'Ahli United Bank', 
        nameAr: 'Ahli United Bank', 
        ibanCode: 'BKME', 
        swiftCode: 'BKMEKWKW', 
        codeAbk: 5, 
        address: 'Kuwait', 
        transferType: 'TRF', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'National Bank of Kuwait', 
        nameAr: 'National Bank of Kuwait', 
        ibanCode: 'NBOK', 
        swiftCode: 'NBOKKWKW', 
        codeAbk: 1, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Commercial Bank of Kuwait', 
        nameAr: 'Commercial Bank of Kuwait', 
        ibanCode: 'COMB', 
        swiftCode: 'COMBKWKW', 
        codeAbk: 2, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Gulf Bank', 
        nameAr: 'Gulf Bank', 
        ibanCode: 'GULB', 
        swiftCode: 'GULBKWKW', 
        codeAbk: 3, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Al-Ahli Bank of Kuwait', 
        nameAr: 'Al-Ahli Bank of Kuwait', 
        ibanCode: 'ABKK', 
        swiftCode: 'ABKKKWKW', 
        codeAbk: 4, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Kuwait International Bank', 
        nameAr: 'Kuwait International Bank', 
        ibanCode: 'KWIB', 
        swiftCode: 'KWIBKWKW', 
        codeAbk: 6, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Burgan Bank', 
        nameAr: 'Burgan Bank', 
        ibanCode: 'BRGN', 
        swiftCode: 'BRGNKWKW', 
        codeAbk: 7, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Kuwait Finance House', 
        nameAr: 'Kuwait Finance House', 
        ibanCode: 'KFHO', 
        swiftCode: 'KFHOKWKW', 
        codeAbk: 9, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Boubyan Bank', 
        nameAr: 'Boubyan Bank', 
        ibanCode: 'BBYN', 
        swiftCode: 'BBYNKWKW', 
        codeAbk: 13, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Warba Bank', 
        nameAr: 'Warba Bank', 
        ibanCode: 'WRBA', 
        swiftCode: 'WRBAKWKW', 
        codeAbk: 23, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
    { 
        nameEn: 'Doha Bank', 
        nameAr: 'Doha Bank', 
        ibanCode: 'DOHB', 
        swiftCode: 'DOHBKWKW', 
        codeAbk: 19, 
        address: 'Kuwait', 
        transferType: 'LCL', 
        isDeleted: false,
        country: {
            connect: { code: 'KW' }
        }
    },
]; 