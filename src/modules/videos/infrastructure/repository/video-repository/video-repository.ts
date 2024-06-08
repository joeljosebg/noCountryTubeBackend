import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateVideoDto } from 'src/modules/videos/aplication/dtos/create-video.dto';
import { Video } from 'src/modules/videos/domain/entities/video.entity';
import { VideoRepositoryPort } from 'src/modules/videos/domain/ports/video-repository';
import { VideoResponse } from 'src/modules/videos/domain/responses/video-response';
import { Repository } from 'typeorm';
import { UPLOAD_FILE_REPOSITORY } from 'src/modules/upload-files/provider.token';
import { UploadFileRepositoryPort } from 'src/modules/upload-files/domain/ports/upload-file-repository';
import { VideoDatailsResponse } from '@/modules/videos/domain/responses/video-details-response';
import { PaginationDto } from '../../../../common/dtos/pagination.dto';

@Injectable()
export class VideoRepositoryImpl implements VideoRepositoryPort {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,

    @Inject(UPLOAD_FILE_REPOSITORY)
    private uploadFileRepository: UploadFileRepositoryPort,
  ) {}

  async createVideo(
    createVideoDto: CreateVideoDto,
    videoPath: string,
    miniaturePath: string,
  ): Promise<VideoResponse<Video>> {
    const videoUrl = await this.uploadFileRepository.uploadVideo(
      videoPath,
      'videos',
    );
    const miniatureUrl = await this.uploadFileRepository.uploadImage(
      miniaturePath,
      'images',
    );

    const videoDb = this.videoRepository.create({
      ...createVideoDto,

      videoUrl: videoUrl,
      miniatureUrl: miniatureUrl,
    });
    await this.videoRepository.save(videoDb);

    const dataResponse = new VideoResponse<Video>(
      true,
      'Created video',
      videoDb,
    );

    return dataResponse;
  }

  async getAllVideos(
    paginationDto: PaginationDto,
  ): Promise<VideoResponse<VideoDatailsResponse[]>> {
    const { limit = 9, offset = 0 } = paginationDto;

    const videos = await this.videoRepository.find({
      take: limit,
      skip: offset,
      relations: {
        user: true,
      },
    });

    const videoDetail = videos.map((video) => {
      const { id, title, videoUrl, miniatureUrl, description, duration } =
        video;
      const { user } = video;

      console.log(user.userName);

      return VideoDatailsResponse.fromObject({
        id,
        title,
        videoUrl,
        miniatureUrl,
        description,
        duration,
        nameUser: user.userName,
      });
    });

    const response = new VideoResponse(true, 'All videos', videoDetail);

    return response;
  }
}
