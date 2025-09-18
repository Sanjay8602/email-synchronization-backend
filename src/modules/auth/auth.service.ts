import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { appConfig } from '../../config/app.config';

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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = appConfig.security.bcryptRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: (user as any)._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: (user as any)._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userModel.findById(payload.sub);
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessTokenExpiresIn = appConfig.jwt.accessTokenExpiresIn;
      const accessToken = this.jwtService.sign(
        { sub: user._id, email: user.email },
        { expiresIn: accessTokenExpiresIn }
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
    });
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userModel.findById(userId);
    return user && user.isActive ? user : null;
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: (user as any)._id, email: user.email };
    
    const accessTokenExpiresIn = appConfig.jwt.accessTokenExpiresIn;
    const refreshTokenExpiresIn = appConfig.jwt.refreshTokenExpiresIn;
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: accessTokenExpiresIn });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshTokenExpiresIn });

    // Store refresh token in database
    await this.userModel.findByIdAndUpdate((user as any)._id, {
      refreshToken,
    });

    return { accessToken, refreshToken };
  }
}
