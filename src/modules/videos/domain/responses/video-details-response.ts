export class VideoDatailsResponse {

    private constructor (
        public id: string,
        public title: string,
        public video: string,
        public miniature: string,
        public duration: string,
        public nameUser: string,
        public description?: string,
    ){}


    public static fromObject( object: {[key: string]: any} ): VideoDatailsResponse {
        
        const { id, title, videoUrl, miniatureUrl, description,duration, nameUser,  } = object;

        console.log(object);

        if( !id || !title || !videoUrl || !nameUser || !miniatureUrl || !duration ) {
            throw new Error('error creating instance VideoDatailsResponse');
        }

        return new VideoDatailsResponse(
            id,
            title,
            videoUrl,
            miniatureUrl,
            duration,
            nameUser,
            description,
        )
    }
    
}






