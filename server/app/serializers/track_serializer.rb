class TrackSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :id, :order, :is_master, :track_type
  belongs_to :project
  # in some cases we dont want to return these relationships for the whole list, just for a given track.
  # like when a track is duplicated, we re-order all other tracks, so only the newly duplicated track gets all
  # relations serialized but all other tracks get serialized without relations

  # TODO: de-dupe this logic
  has_one :init_script, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_one :onstep_script, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_many :track_controls, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_many :filepath_controls, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
  has_many :sequences, if: Proc.new { |record, params| !params[:relations_only_for] || (params[:relations_only_for] && record == params[:relations_only_for]) } 
end