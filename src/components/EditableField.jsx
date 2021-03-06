import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Input, Space, Tooltip,
} from 'antd';

import {
  EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons';

const EditableField = (props) => {
  const {
    value, deleteEnabled, showEdit, onAfterSubmit, onAfterCancel, renderBold, defaultEditing,
  } = props;
  const [editing, setEditing] = useState(defaultEditing);
  const [editedValue, setEditedValue] = useState(value);

  const deleteEditableField = () => {
    props.onDelete();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSubmit();
    }

    if (event.key === 'Escape') {
      onCancel();
    }
  };

  const onChange = (e) => {
    const { value: newValue } = e.target;

    setEditedValue(newValue);
  };

  const onSubmit = () => {
    onAfterSubmit(editedValue);
    toggleEditing();
  };

  const onCancel = () => {
    setEditedValue(value);
    toggleEditing();
    onAfterCancel();
  };

  const toggleEditing = () => {
    setEditing(!editing);
  };

  const renderEditState = () => {
    if (editing) {
      return (
        <>
          <Input
            autoFocus
            onChange={onChange}
            size='small'
            defaultValue={editedValue}
            onKeyDown={onKeyDown}
          />

          <Tooltip placement='bottom' title='Save' mouseLeaveDelay={0}>
            <Button size='small' shape='circle' icon={<CheckOutlined />} onClick={onSubmit} />
          </Tooltip>

          <Tooltip placement='bottom' title='Cancel' mouseLeaveDelay={0}>
            <Button size='small' shape='circle' icon={<CloseOutlined />} onClick={onCancel} />
          </Tooltip>

        </>
      );
    }

    return (
      <>
        {renderBold ? <strong>{editedValue}</strong> : <span>{editedValue}</span>}
        {
          showEdit
            ? (
              <Tooltip placement='bottom' title='Edit' mouseLeaveDelay={0}>
                <Button size='small' shape='circle' icon={<EditOutlined />} onClick={toggleEditing} />
              </Tooltip>
            ) : <></>
        }
      </>
    );
  };

  return (
    <Space>
      {renderEditState()}
      {
        deleteEnabled
          ? (
            <Tooltip placement='bottom' title='Delete' mouseLeaveDelay={0}>
              <Button size='small' shape='circle' icon={<DeleteOutlined />} onClick={deleteEditableField} />
            </Tooltip>
          ) : <></>
      }
    </Space>
  );
};

EditableField.defaultProps = {
  onAfterSubmit: () => null,
  onAfterCancel: () => null,
  onDelete: () => null,
  renderBold: false,
  showEdit: true,
  deleteEnabled: true,
  defaultEditing: false,
};

EditableField.propTypes = {
  value: PropTypes.string.isRequired,
  onAfterSubmit: PropTypes.func,
  onAfterCancel: PropTypes.func,
  onDelete: PropTypes.func,
  deleteEnabled: PropTypes.bool,
  showEdit: PropTypes.bool,
  renderBold: PropTypes.bool,
  defaultEditing: PropTypes.bool,
};

export default EditableField;
