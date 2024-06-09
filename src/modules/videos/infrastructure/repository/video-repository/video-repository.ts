import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateVideoDto } from 'src/modules/videos/aplication/dtos/create-video.dto';
import { Video } from 'src/modules/videos/domain/entities/video.entity';
import { VideoRepositoryPort } from 'src/modules/videos/domain/ports/video-repository';
import { VideoResponse } from 'src/modules/videos/domain/responses/video-response';
import { Repository } from 'typeorm';
import { UPLOAD_FILE_REPOSITORY } from 'src/modules/upload-files/provider.token';
import { UploadFileRepositoryPort } from 'src/modules/upload-files/domain/ports/upload-file-repository';
import { VideoDetailsResponse } from '@/modules/videos/domain/responses/video-details-response';
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
  ): Promise<VideoResponse<VideoDetailsResponse[]>> {
    const { limit = 9, offset = 0 } = paginationDto;

    const videos = await this.videoRepository.find({
      take: limit,
      skip: offset,
      relations: {
        user: true,
      },
    });

    const videoDetail = videos.map((video) => {
      return this.getInstanceVideoDetailResponse(video);
    });

    const response = new VideoResponse(true, 'All videos', videoDetail);

    return response;
  }


  async getVideoDetailById(idVideo: string): Promise<VideoResponse<VideoDetailsResponse>> {

    const video = await this.videoRepository.findOne(
      { where: { id: idVideo }, relations: { user: true} }
    );

    if( !video ) throw new NotFoundException(`Video with id ${idVideo} not found`);

    const videoDetail = this.getInstanceVideoDetailResponse(video);

    const response = new VideoResponse(true, 'Video by id', videoDetail);

    return response;

  }

  async searchVideos(term: string): Promise<VideoResponse<VideoDetailsResponse[]>> {

    const queryBuilder = this.videoRepository.createQueryBuilder('video');

    const videos = await queryBuilder
      .where(`UPPER(video.title) like :title`, {
        title: `%${term.toUpperCase()}%`,
      })
      .leftJoinAndSelect('video.user', 'userId')
      .getMany();


    const videoDetail = videos.map((video) => {
      return this.getInstanceVideoDetailResponse(video);
    });

    const response = new VideoResponse(true, 'All videos', videoDetail);

    return response;
    
  }

  private getInstanceVideoDetailResponse( video: Video ): VideoDetailsResponse {

    const { id, title, videoUrl, miniatureUrl, description, duration } = video;
    const { user } = video;


    return VideoDetailsResponse.fromObject({
      id,
      title,
      videoUrl,
      miniatureUrl,
      description,
      duration,
      nameUser: user.userName,
    });

  }

}
