import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';

function FileUploadButtonComponent() {
    const [uploadOpen, modal_handlers] = useDisclosure(false);
    const [percent, setpercent] = useState(0)

    const attributes = {
        src: import.meta.env.VITE_SPARK_NOTEBOOK_SERVER,
        width: "100%",
        height: "100%",
        frameBorder: 1, // show frame border just for fun...
    };

    return (
        <div>

            <Button component='a' href={ import.meta.env.VITE_SPARK_NOTEBOOK_SERVER} target='_blank' variant="default" radius={"xl"}>Upload GPS data</Button>


            {/* <Modal.Root closeOnClickOutside={false} opened={uploadOpen} size={"xl"} fullScreen onClose={modal_handlers.close}>
                <Modal.Overlay color="#ddd" opacity={0.59} blur={4} />
                <Modal.Content>
                    <Modal.Header className="border-b border-b-gray-200">
                        <Modal.Title>Upload GPS CVS Data</Modal.Title>
                        <Modal.CloseButton />
                    </Modal.Header>
                    <Modal.Body className=" min-h-60 space-y-4">
                        <div >
                          <iframe src={ import.meta.env.VITE_SPARK_NOTEBOOK_SERVER} />
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
            </Modal.Root> */}
        </div>
    );
}

export default FileUploadButtonComponent