import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../../database/schemas/user.schema';
export interface LoginDto {
    email: string;
    password: string;
}
export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private userModel;
    private jwtService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string): Promise<void>;
    validateUser(userId: string): Promise<User | null>;
    private generateTokens;
}
