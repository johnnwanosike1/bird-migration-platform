import { Button, Group, Modal, Progress, Text, rem } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { Dropzone, IMAGE_MIME_TYPE, } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import toast from 'react-hot-toast';

function FileUploadButtonComponent() {
    const [uploadOpen, modal_handlers] = useDisclosure(false);
    const [percent, setpercent] = useState(0)
    return (
        <div>

            <Button onClick={modal_handlers.open} variant="default" radius={"xl"}>Upload GPS data</Button>


            <Modal.Root closeOnClickOutside={false} opened={uploadOpen} size={"lg"} onClose={modal_handlers.close}>
                <Modal.Overlay color="#ddd" opacity={0.59} blur={4} />
                <Modal.Content>
                    <Modal.Header className="border-b border-b-gray-200">
                        <Modal.Title>Upload GPS CVS Data</Modal.Title>
                        <Modal.CloseButton />
                    </Modal.Header>
                    <Modal.Body className=" min-h-60 space-y-4">
                        <div >
                            <Dropzone
                                onDrop={(files) => {
                                    var data = new FormData();
                                    data.append("file", files[0], files[0].name);

                                    var xhr = new XMLHttpRequest();
                                    xhr.withCredentials = true;

                                    xhr.addEventListener("readystatechange", function () {
                                        if (this.readyState === 4) {
                                            console.log(this.responseText);
                                        }
                                    });

                                    xhr.upload.onprogress = (event) => {
                                        if (event.lengthComputable) {
                                            const percent = Math.round((event.loaded / event.total) * 100);
                                            // setProgress(percent);

                                            setpercent(percent);

                                        }
                                    };

                                    xhr.onload = () => {
                                         setpercent(0);

                                        if (xhr.status >= 200 && xhr.status < 300) {
                                            toast.success("File uploaded successfully");
                                            console.log(JSON.parse(xhr.responseText));
                                            modal_handlers.close()
                                        } else {
                                            alert("Upload failed");
                                        }
                                    };

                                    xhr.open("POST", `${import.meta.env.VITE_BACKEND_SERVER}/upload`);

                                    xhr.send(data);
                                }}
                                onReject={(files) => console.log('rejected', files)}
                                maxSize={5 * 1024 ** 3}
                                className='border border-dashed border-gray-400 rounded-md'
                                accept={{
                                    'text/*': ["text/csv"],
                                }}
                            >
                                <Group justify="center" gap="xl" mih={180} style={{ pointerEvents: 'none' }}>
                                    <Dropzone.Accept>
                                        <IconUpload size={52} stroke={1.5} />
                                    </Dropzone.Accept>
                                    <Dropzone.Reject>
                                        <IconX size={52} stroke={1.5} />
                                    </Dropzone.Reject>
                                    <Dropzone.Idle>
                                        <IconPhoto size={52} stroke={1.5} />
                                    </Dropzone.Idle>

                                    <div>
                                        <Text size="md" fw={500}>
                                            Drag files here or click to select
                                        </Text>
                                        <Text size="sm" c="dimmed" mt={4}>
                                            PNG, JPG, GIF up to 10 MB
                                        </Text>
                                    </div>
                                </Group>
                            </Dropzone>
                        </div>
                        <div>
                            {percent > 0 && <Progress.Root size="xl">
                                <Progress.Section value={percent} animated>
                                    <Progress.Label>{percent}%</Progress.Label>
                                </Progress.Section>
                            </Progress.Root>}


                        </div>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
        </div>
    );
}

export default FileUploadButtonComponent