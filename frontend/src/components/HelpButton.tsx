import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';
import buttonStyle from "../styles/button.module.css"
import { AiOutlineClose, AiOutlineCloseCircle } from 'react-icons/ai';
import { VscClose } from 'react-icons/vsc';

const HelpButton = ({ }) => {
    const popupRef = React.useRef<HTMLDivElement>(null);

    return (
        <Dialog.Root disablePointerDismissal={true}>
            <Dialog.Trigger className={buttonStyle.Button}>
                About BirdsEye — v1.0.0
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Backdrop className={buttonStyle.Backdrop} />
                <Dialog.Viewport className={buttonStyle.Viewport}>
                    <ScrollArea.Root style={{ position: undefined }} className={buttonStyle.ScrollViewport}>
                        <ScrollArea.Viewport className={buttonStyle.ScrollViewport}>
                            <ScrollArea.Content className={buttonStyle.ScrollContent}>
                                <Dialog.Popup ref={popupRef} className={buttonStyle.Popup} initialFocus={popupRef}>
                                    <div className={buttonStyle.PopupHeader}>
                                        <Dialog.Title className={buttonStyle.Title}>About BirdsEye </Dialog.Title>
                                        <Dialog.Close className={buttonStyle.Close} aria-label="Close">
                                            <VscClose size={27} />
                                        </Dialog.Close>
                                    </div>

                                    <div className={buttonStyle.Body}>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sed ultricies nisi. Duis maximus quam in turpis ultrices dapibus. Nulla facilisi. In luctus nunc et tortor porta semper. Nulla facilisi. Nullam pulvinar ornare est eget pretium. Praesent at fringilla orci. Aenean ante eros, sollicitudin vel elementum in, vulputate in metus. Quisque egestas mauris dui. Fusce pretium ut dolor sed dignissim. Duis facilisis iaculis ante. Sed vitae tortor ac ligula maximus volutpat. Praesent laoreet, turpis sit amet consectetur sagittis, lacus ipsum laoreet quam, id porttitor felis enim at nisi.

                                        Proin ac tempus nisl. Aliquam ultricies consectetur magna at laoreet. Ut posuere quis felis in dignissim. Phasellus arcu tortor, bibendum vitae bibendum at, rhoncus eget ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque ac nisl blandit, lobortis turpis quis, imperdiet nisl. Etiam ac odio aliquam, venenatis diam at, vehicula odio. Aliquam ultrices tristique leo quis ultrices. Etiam consequat, lacus dapibus posuere blandit, libero neque vehicula tortor, a laoreet diam justo at quam. Pellentesque interdum lobortis fermentum. Mauris finibus diam id tortor tincidunt iaculis ac nec felis. Donec et nulla eros. Mauris tincidunt justo at nisi rutrum eleifend.

                                        Curabitur id consectetur felis, iaculis cursus turpis. Nam vel enim non elit aliquam feugiat. Phasellus vulputate tortor quam. Nullam ex nisi, viverra nec nisi sed, gravida scelerisque sem. Mauris lacinia semper turpis non ultrices. Aenean ultricies arcu ut dictum aliquet. Sed diam ligula, ullamcorper et feugiat at, blandit eget ex. Aenean sed dui vehicula, ultricies sapien sit amet, finibus sem. Nam efficitur sem eget ante egestas malesuada. Vivamus quis erat eu felis ullamcorper sagittis. In dictum ullamcorper felis, vel congue lectus mollis vel. Integer auctor, velit eu eleifend gravida, massa dui rutrum nibh, vestibulum fringilla ex erat non dolor. Curabitur luctus ligula id viverra finibus. Donec ultricies lorem id tempus pretium. Ut vel pulvinar magna.
                                    </div>

                                </Dialog.Popup>
                            </ScrollArea.Content>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar className={buttonStyle.Scrollbar}>
                            <ScrollArea.Thumb className={buttonStyle.ScrollbarThumb} />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default HelpButton