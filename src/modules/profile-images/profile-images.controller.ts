import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { ProfileImagesService } from './profile-images.service';
import { ImageResponseDto } from './dto/image-response.dto';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks } from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';

@ApiTags('profile-images')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
@Controller('profiles/:profileId/images')
export class ProfileImagesController {
  constructor(private readonly profileImagesService: ProfileImagesService) {}

  @ApiOperation({ summary: 'Upload a new image to the profile' })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID of the profile',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        index: {
          type: 'number',
          description: 'Index position for the image (0-5)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: ImageResponseDto,
  })
  @HateoasLinks('profileImage', AppLinkBuilders.profileImageLinks())
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  public async uploadImage(
    @Param('profileId', ParseIntPipe) profileId: number,
    @UploadedFile() file: Express.MulterS3.File,
    @Req() req: HttpRequestDto,
  ): Promise<ImageResponseDto> {
    return this.profileImagesService.uploadImage(profileId, file, req);
  }

  @ApiOperation({ summary: 'Replace a specific image' })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID of the profile',
  })
  @ApiParam({
    name: 'index',
    type: Number,
    description: 'Index of the image to replace',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image replaced successfully',
    type: ImageResponseDto,
  })
  @HateoasLinks('profileImage', AppLinkBuilders.profileImageLinks())
  @Put(':index')
  @UseInterceptors(FileInterceptor('image'))
  public async replaceImage(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('index', ParseIntPipe) index: number,
    @UploadedFile() file: Express.MulterS3.File,
    @Req() req: HttpRequestDto,
  ): Promise<ImageResponseDto> {
    return this.profileImagesService.replaceImage(profileId, index, file, req);
  }

  @ApiOperation({ summary: 'Delete a specific image' })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID of the profile',
  })
  @ApiParam({
    name: 'index',
    type: Number,
    description: 'Index of the image to delete (0-5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
  })
  @HateoasLinks('profileImage', AppLinkBuilders.profileImageLinks())
  @Delete(':index')
  public async deleteImage(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: HttpRequestDto,
  ): Promise<{ message: string }> {
    return this.profileImagesService.deleteImage(profileId, index, req);
  }
}
